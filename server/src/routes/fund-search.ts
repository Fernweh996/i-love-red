import { Router } from 'express';
import { searchCache, getCachedOrFetch } from '../middleware/cache';
import { parseFundList } from '../parsers/jsonp';

const router = Router();

interface FundItem {
  code: string;
  pinyin: string;
  name: string;
  type: string;
  pinyinFull: string;
}

let fundListPromise: Promise<FundItem[]> | null = null;

async function loadFundList(): Promise<FundItem[]> {
  return getCachedOrFetch(searchCache, 'fund-list', async () => {
    console.log('Loading fund list from eastmoney...');
    const response = await fetch(
      'https://fund.eastmoney.com/js/fundcode_search.js',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://fund.eastmoney.com/',
        },
      }
    );
    const text = await response.text();
    const list = parseFundList(text);
    console.log(`Loaded ${list.length} funds`);
    return list;
  });
}

// GET /api/fund/search?q=keyword
router.get('/', async (req, res, next) => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();
    if (!query) {
      return res.json([]);
    }

    // Lazy-load the fund list
    if (!fundListPromise) {
      fundListPromise = loadFundList();
    }
    const list = await fundListPromise;

    // Search by code, name, or pinyin
    const results = list
      .filter(
        (f) =>
          f.code.includes(query) ||
          f.name.toLowerCase().includes(query) ||
          f.pinyin.toLowerCase().includes(query) ||
          f.pinyinFull.toLowerCase().includes(query)
      )
      .slice(0, 20)
      .map((f) => ({
        code: f.code,
        name: f.name,
        type: f.type,
        pinyin: f.pinyin,
      }));

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export { router as fundSearchRouter };
