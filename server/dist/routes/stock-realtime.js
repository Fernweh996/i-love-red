"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockRealtimeRouter = void 0;
const express_1 = require("express");
const cache_1 = require("../middleware/cache");
const gbk_1 = require("../parsers/gbk");
const router = (0, express_1.Router)();
exports.stockRealtimeRouter = router;
// GET /api/stock/realtime?codes=sz000001,sh600036
router.get('/', async (req, res, next) => {
    try {
        const codes = (req.query.codes || '').trim();
        if (!codes) {
            return res.json([]);
        }
        const data = await (0, cache_1.getCachedOrFetch)(cache_1.stockCache, `stock-${codes}`, async () => {
            const url = `https://qt.gtimg.cn/q=${codes}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    Referer: 'https://finance.qq.com/',
                },
            });
            const buffer = Buffer.from(await response.arrayBuffer());
            return (0, gbk_1.parseStockQuotes)(buffer);
        });
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=stock-realtime.js.map