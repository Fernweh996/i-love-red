import * as cheerio from 'cheerio';

export interface NavRecord {
  date: string;
  nav: number;
  accNav: number;
  changeRate: number;
}

/**
 * Parse NAV history HTML table from eastmoney
 */
export function parseNavHistory(html: string): { records: NavRecord[]; totalCount: number } {
  const $ = cheerio.load(html);
  const records: NavRecord[] = [];

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
export function parseHoldings(html: string): HoldingStock[] {
  const $ = cheerio.load(html);
  const holdings: HoldingStock[] = [];

  // Only parse the first table (most recent quarter)
  const firstTable = $('table.w782').first();
  if (firstTable.length === 0) {
    // Fallback: try any table
    $('table').first().find('tbody tr').each((_, row) => {
      parseHoldingRow($, row, holdings);
    });
  } else {
    firstTable.find('tbody tr').each((_, row) => {
      parseHoldingRow($, row, holdings);
    });
  }

  return holdings;
}

function parseHoldingRow($: cheerio.CheerioAPI, row: any, holdings: HoldingStock[]) {
  const tds = $(row).find('td');
  if (tds.length < 7) return;

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
