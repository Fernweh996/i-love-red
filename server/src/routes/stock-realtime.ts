import { Router } from 'express';
import { stockCache, getCachedOrFetch } from '../middleware/cache';
import { parseStockQuotes } from '../parsers/gbk';

const router = Router();

// GET /api/stock/realtime?codes=sz000001,sh600036
router.get('/', async (req, res, next) => {
  try {
    const codes = (req.query.codes as string || '').trim();
    if (!codes) {
      return res.json([]);
    }

    const data = await getCachedOrFetch(stockCache, `stock-${codes}`, async () => {
      const url = `https://qt.gtimg.cn/q=${codes}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://finance.qq.com/',
        },
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      return parseStockQuotes(buffer);
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export { router as stockRealtimeRouter };
