"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNavHistory = parseNavHistory;
exports.parseHoldings = parseHoldings;
const cheerio = __importStar(require("cheerio"));
/**
 * Parse NAV history HTML table from eastmoney
 */
function parseNavHistory(html) {
    const $ = cheerio.load(html);
    const records = [];
    let totalCount = 0;
    const countMatch = html.match(/records:(\d+)/);
    if (countMatch) {
        totalCount = parseInt(countMatch[1], 10);
    }
    $('tbody tr').each((_, row) => {
        const tds = $(row).find('td');
        if (tds.length >= 4) {
            const date = $(tds[0]).text().trim();
            const nav = parseFloat($(tds[1]).text().trim());
            const accNav = parseFloat($(tds[2]).text().trim());
            const changeRateStr = $(tds[3]).text().trim().replace('%', '');
            const changeRate = changeRateStr === '' ? 0 : parseFloat(changeRateStr);
            if (date && !isNaN(nav)) {
                records.push({ date, nav, accNav: isNaN(accNav) ? nav : accNav, changeRate: isNaN(changeRate) ? 0 : changeRate });
            }
        }
    });
    return { records, totalCount };
}
/**
 * Parse fund holdings from eastmoney FundArchivesDatas API response
 * Table columns: 序号 | 股票代码 | 股票名称 | 最新价 | 涨跌幅 | 相关资讯 | 占净值比例 | 持股数(万股) | 持仓市值(万元)
 */
function parseHoldings(html) {
    const $ = cheerio.load(html);
    const holdings = [];
    // Only parse the first table (most recent quarter)
    const firstTable = $('table.w782').first();
    if (firstTable.length === 0) {
        // Fallback: try any table
        $('table').first().find('tbody tr').each((_, row) => {
            parseHoldingRow($, row, holdings);
        });
    }
    else {
        firstTable.find('tbody tr').each((_, row) => {
            parseHoldingRow($, row, holdings);
        });
    }
    return holdings;
}
function parseHoldingRow($, row, holdings) {
    const tds = $(row).find('td');
    if (tds.length < 7)
        return;
    // Column 1: stock code (may contain HK codes like 00700 or A-share 6-digit)
    const codeText = $(tds[1]).text().trim();
    const nameText = $(tds[2]).text().trim();
    // Column 6 (0-indexed): 占净值比例
    const proportionText = $(tds[6]).text().trim().replace('%', '').replace(/,/g, '');
    // Column 7: 持股数(万股)
    const sharesText = $(tds[7])?.text().trim().replace(/,/g, '') || '0';
    // Column 8: 持仓市值(万元)
    const marketValueText = $(tds[8])?.text().trim().replace(/,/g, '') || '0';
    if (codeText && nameText && /^\d{5,6}$/.test(codeText)) {
        holdings.push({
            code: codeText,
            name: nameText,
            proportion: parseFloat(proportionText) || 0,
            shares: parseFloat(sharesText) || 0,
            marketValue: parseFloat(marketValueText) || 0,
        });
    }
}
//# sourceMappingURL=html.js.map