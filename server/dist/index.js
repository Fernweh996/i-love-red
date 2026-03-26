"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fund_search_1 = require("./routes/fund-search");
const fund_estimate_1 = require("./routes/fund-estimate");
const fund_history_1 = require("./routes/fund-history");
const fund_holdings_1 = require("./routes/fund-holdings");
const stock_realtime_1 = require("./routes/stock-realtime");
const upload_1 = require("./routes/upload");
const error_handler_1 = require("./middleware/error-handler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// API routes
app.use('/api/fund/search', fund_search_1.fundSearchRouter);
app.use('/api/fund/estimate', fund_estimate_1.fundEstimateRouter);
app.use('/api/fund/history', fund_history_1.fundHistoryRouter);
app.use('/api/fund/holdings', fund_holdings_1.fundHoldingsRouter);
app.use('/api/stock/realtime', stock_realtime_1.stockRealtimeRouter);
app.use('/api/upload', upload_1.uploadRouter);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
// Serve frontend static files (production)
const clientDist = path_1.default.resolve(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDist));
// SPA fallback: any non-API route → index.html
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(clientDist, 'index.html'));
});
// Error handler
app.use(error_handler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Fund Manager running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map