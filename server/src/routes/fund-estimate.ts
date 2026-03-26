import { Router } from 'express';
import { estimateCache, confirmedNavCache, getCachedOrFetch } from '../middleware/cache';
import { parseJsonp } from '../parsers/jsonp';

const router = Router();

/** Today's date string in Asia/Shanghai timezone (YYYY-MM-DD) */
function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

/** Check if it's after China market close (15:00 CST) */
function isChinaAfterMarketClose(): boolean {
  const now = new Date();
  const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const hour = chinaTime.getHours();
  const minute = chinaTime.getMinutes();
  const day = chinaTime.getDay();

  // Weekend — treat as "after close"
  if (day === 0 || day === 6) return true;

  // After 15:00 on weekdays
  return hour * 100 + minute >= 1500;
}

/** Fetch confirmed (official) NAV from eastmoney history API */
async function fetchConfirmedNav(
  code: string
): Promise<{ nav: number; change: number; date: string } | null> {
  try {
    return await getCachedOrFetch(confirmedNavCache, `confirmed-${code}`, async () => {
      const url = `https://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz&code=${code}&page=1&sdate=&edate=&per=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: `https://fund.eastmoney.com/f10/jjjz_${code}.html`,
        },
      });
      const text = await response.text();

      // Parse: var apidata={content:"<table>...<tr><td>2024-01-15</td><td>1.2345</td><td>1.2345</td><td>0.50%</td>...</tr>..."}
      const contentMatch = text.match(/content:"(.+?)"/s);
      if (!contentMatch) return null;

      const html = contentMatch[1];
      // Extract first data row
      const rowMatch = html.match(
        /<tr[^>]*>\s*<td>(\d{4}-\d{2}-\d{2})<\/td>\s*<td[^>]*>([\d.]+)<\/td>\s*<td[^>]*>[\d.]+<\/td>\s*<td[^>]*>([^<]*)<\/td>/
      );
      if (!rowMatch) return null;

      const [, date, navStr, changeStr] = rowMatch;
      const today = getTodayDateString();

      if (date !== today) return null; // Not yet published for today

      const nav = parseFloat(navStr);
      const change = parseFloat(changeStr) || 0;

      return { nav, change, date };
    });
  } catch {
    return null;
  }
}

/** Build estimate data from raw JSONP response */
function buildEstimateData(json: any) {
  return {
    code: json.fundcode,
    name: json.name,
    estimateNav: parseFloat(json.gsz),
    estimateChange: parseFloat(json.gszzl),
    estimateTime: json.gztime,
    lastNav: parseFloat(json.dwjz),
    lastNavDate: json.jzrq,
  };
}

/** Enrich estimate data with confirmed NAV if available */
async function enrichWithConfirmedNav(data: any): Promise<any> {
  if (!isChinaAfterMarketClose()) {
    return { ...data, navSource: 'estimate' as const };
  }

  const confirmed = await fetchConfirmedNav(data.code);
  if (confirmed) {
    return {
      ...data,
      navSource: 'confirmed' as const,
      confirmedNav: confirmed.nav,
      confirmedChange: confirmed.change,
      confirmedDate: confirmed.date,
    };
  }

  return { ...data, navSource: 'estimate' as const };
}

// GET /api/fund/estimate/:code
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid fund code' });
    }

    const data = await getCachedOrFetch(estimateCache, `estimate-${code}`, async () => {
      const url = `https://fundgz.1234567.com.cn/js/${code}.js`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://fund.eastmoney.com/',
        },
      });
      const text = await response.text();

      if (!text || text.includes('errmsg')) {
        throw new Error(`Fund ${code} not found or no estimate data`);
      }

      const json = parseJsonp(text);
      return buildEstimateData(json);
    });

    const enriched = await enrichWithConfirmedNav(data);
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// GET /api/fund/estimate/batch?codes=000001,000002
router.get('/', async (req, res, next) => {
  try {
    const codes = (req.query.codes as string || '').split(',').filter(Boolean);
    if (codes.length === 0) {
      return res.json([]);
    }

    const results = await Promise.allSettled(
      codes.map(async (code) => {
        const data = await getCachedOrFetch(estimateCache, `estimate-${code}`, async () => {
          const url = `https://fundgz.1234567.com.cn/js/${code}.js`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Referer: 'https://fund.eastmoney.com/',
            },
          });
          const text = await response.text();
          if (!text || text.includes('errmsg')) return null;
          const json = parseJsonp(text);
          return buildEstimateData(json);
        });

        if (!data) return null;
        return enrichWithConfirmedNav(data);
      })
    );

    const data = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export { router as fundEstimateRouter };
