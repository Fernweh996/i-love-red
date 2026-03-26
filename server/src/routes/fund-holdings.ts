import { Router } from 'express';
import { holdingsCache, getCachedOrFetch } from '../middleware/cache';
import { parseHoldings } from '../parsers/html';

const router = Router();

// GET /api/fund/holdings/:code
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid fund code' });
    }

    const data = await getCachedOrFetch(holdingsCache, `holdings-${code}`, async () => {
      // Use the AJAX API that the page calls for holdings data
      const url = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=10`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: `https://fundf10.eastmoney.com/ccmx_${code}.html`,
        },
      });
      const text = await response.text();

      // Response is: var apidata={ content:"<div>...</div>",... }
      const contentMatch = text.match(/content:"(.+?)"\s*,/s);
      const html = contentMatch ? contentMatch[1] : text;

      return parseHoldings(html);
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export { router as fundHoldingsRouter };
