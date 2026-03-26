import iconv from 'iconv-lite';

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
export function parseStockQuotes(buffer: Buffer): StockQuote[] {
  const text = iconv.decode(buffer, 'gbk');
  const quotes: StockQuote[] = [];
  const lines = text.split(';').filter((l) => l.trim());

  for (const line of lines) {
    const match = line.match(/v_\w+="(.+)"/);
    if (!match) continue;

    const parts = match[1].split('~');
    if (parts.length < 45) continue;

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
