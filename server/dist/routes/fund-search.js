"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundSearchRouter = void 0;
const express_1 = require("express");
const cache_1 = require("../middleware/cache");
const jsonp_1 = require("../parsers/jsonp");
const router = (0, express_1.Router)();
exports.fundSearchRouter = router;
let fundListPromise = null;
async function loadFundList() {
    return (0, cache_1.getCachedOrFetch)(cache_1.searchCache, 'fund-list', async () => {
        console.log('Loading fund list from eastmoney...');
        const response = await fetch('https://fund.eastmoney.com/js/fundcode_search.js', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Referer: 'https://fund.eastmoney.com/',
            },
        });
        const text = await response.text();
        const list = (0, jsonp_1.parseFundList)(text);
        console.log(`Loaded ${list.length} funds`);
        return list;
    });
}
// GET /api/fund/search?q=keyword
router.get('/', async (req, res, next) => {
    try {
        const query = (req.query.q || '').trim().toLowerCase();
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
            .filter((f) => f.code.includes(query) ||
            f.name.toLowerCase().includes(query) ||
            f.pinyin.toLowerCase().includes(query) ||
            f.pinyinFull.toLowerCase().includes(query))
            .slice(0, 20)
            .map((f) => ({
            code: f.code,
            name: f.name,
            type: f.type,
            pinyin: f.pinyin,
        }));
        res.json(results);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=fund-search.js.map