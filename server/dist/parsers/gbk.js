"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStockQuotes = parseStockQuotes;
const iconv_lite_1 = __importDefault(require("iconv-lite"));
/**
 * Parse Tencent stock quote response (GBK encoded)
 * Format: v_sz000001="1~平安银行~000001~10.52~10.53~10.55~...";
 */
function parseStockQuotes(buffer) {
    const text = iconv_lite_1.default.decode(buffer, 'gbk');
    const quotes = [];
    const lines = text.split(';').filter((l) => l.trim());
    for (const line of lines) {
        const match = line.match(/v_\w+="(.+)"/);
        if (!match)
            continue;
        const parts = match[1].split('~');
        if (parts.length < 45)
            continue;
        quotes.push({
            code: parts[2],
            name: parts[1],
            price: parseFloat(parts[3]) || 0,
            prevClose: parseFloat(parts[4]) || 0,
            open: parseFloat(parts[5]) || 0,
            high: parseFloat(parts[33]) || parseFloat(parts[41]) || 0,
            low: parseFloat(parts[34]) || parseFloat(parts[42]) || 0,
            volume: parseFloat(parts[6]) || 0,
            amount: parseFloat(parts[37]) || 0,
            change: parseFloat(parts[31]) || 0,
            changeRate: parseFloat(parts[32]) || 0,
        });
    }
    return quotes;
}
//# sourceMappingURL=gbk.js.map