import { Router } from 'express';
import { historyCache, getCachedOrFetch } from '../middleware/cache';
import { parseNavHistory, type NavRecord } from '../parsers/html';

const router = Router();

// Eastmoney API silently caps per-page around 40 records.
// For larger requests we fetch multiple pages and merge.
const API_PER_PAGE = 40;

async function fetchOnePage(code: string, page: number, per: number) {
  const url = `https://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz&code=${code}&page=${page}&sdate=&edate=&per=${per}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: `https://fund.eastmoney.com/f10/jjjz_${code}.html`,
    },
  });
  const text = await response.text();

  // Response: var apidata={content:"<table>...</table>",records:120,pages:6,...}
  // Extract totalCount from the outer wrapper (not available inside HTML)
  let totalCount = 0;
  const recordsMatch = text.match(/records:(\d+)/);
  if (recordsMatch) {
    totalCount = parseInt(recordsMatch[1], 10);
  }

  const contentMatch = text.match(/content:"(.+?)"/s);
  const html = contentMatch ? contentMatch[1] : text;
  const parsed = parseNavHistory(html);

  return { records: parsed.records, totalCount: totalCount || parsed.totalCount };
}

// GET /api/fund/history/:code?page=1&size=20
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 30;

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid fund code' });
    }

    const cacheKey = `history-${code}-${page}-${size}`;
    const data = await getCachedOrFetch(historyCache, cacheKey, async () => {
      // Small request — single API call
      if (size <= API_PER_PAGE) {
        return fetchOnePage(code, page, size);
      }

      // Large request (chart periods like 6m=132, 1y=252, all=500):
      // Fetch multiple pages of API_PER_PAGE and merge.
      // The eastmoney API returns newest-first, so page 1 = most recent records.
      const pagesNeeded = Math.ceil(size / API_PER_PAGE);
      let allRecords: NavRecord[] = [];
      let totalCount = 0;

      for (let p = 1; p <= pagesNeeded; p++) {
        const result = await fetchOnePage(code, p, API_PER_PAGE);
        totalCount = result.totalCount;
        allRecords.push(...result.records);
        // Stop early if we've fetched everything available
        if (allRecords.length >= totalCount || result.records.length < API_PER_PAGE) {
          break;
        }
      }

      // Trim to requested size
      allRecords = allRecords.slice(0, size);

      return { records: allRecords, totalCount };
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export { router as fundHistoryRouter };
