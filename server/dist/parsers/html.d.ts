export interface NavRecord {
    date: string;
    nav: number;
    accNav: number;
    changeRate: number;
}
/**
 * Parse NAV history HTML table from eastmoney
 */
export declare function parseNavHistory(html: string): {
    records: NavRecord[];
    totalCount: number;
};
export interface HoldingStock {
    code: string;
    name: string;
    proportion: number;
    shares: number;
    marketValue: number;
}
/**
 * Parse fund holdings from eastmoney FundArchivesDatas API response
 * Table columns: 序号 | 股票代码 | 股票名称 | 最新价 | 涨跌幅 | 相关资讯 | 占净值比例 | 持股数(万股) | 持仓市值(万元)
 */
export declare function parseHoldings(html: string): HoldingStock[];
//# sourceMappingURL=html.d.ts.map