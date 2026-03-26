"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundHistoryRouter = void 0;
const express_1 = require("express");
const cache_1 = require("../middleware/cache");
const html_1 = require("../parsers/html");
const router = (0, express_1.Router)();
exports.fundHistoryRouter = router;
// GET /api/fund/history/:code?page=1&size=20
router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 30;
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ error: 'Invalid fund code' });
        }
        const cacheKey = `history-${code}-${page}-${size}`;
        const data = await (0, cache_1.getCachedOrFetch)(cache_1.historyCache, cacheKey, async () => {
            const url = `https://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz&code=${code}&page=${page}&sdate=&edate=&per=${size}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    Referer: `https://fund.eastmoney.com/f10/jjjz_${code}.html`,
                },
            });
            const text = await response.text();
            // The response contains: var apidata={content:"<table>...</table>",records:120,pages:6,...}
            const contentMatch = text.match(/content:"(.+?)"/s);
            const html = contentMatch ? contentMatch[1] : text;
            return (0, html_1.parseNavHistory)(html);
        });
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=fund-history.js.map