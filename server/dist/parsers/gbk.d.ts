export interface StockQuote {
    code: string;
    name: string;
    price: number;
    change: number;
    changeRate: number;
    open: number;
    prevClose: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
}
/**
 * Parse Tencent stock quote response (GBK encoded)
 * Format: v_sz000001="1~平安银行~000001~10.52~10.53~10.55~...";
 */
export declare function parseStockQuotes(buffer: Buffer): StockQuote[];
//# sourceMappingURL=gbk.d.ts.map