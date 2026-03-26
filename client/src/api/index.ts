import type { FundInfo, FundEstimate, NavRecord, HoldingStock, StockQuote, ParsedFund } from '@/types';

const BASE = '/api';

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Fund search
export async function searchFunds(query: string, signal?: AbortSignal): Promise<FundInfo[]> {
  if (!query.trim()) return [];
  return fetchJSON(`${BASE}/fund/search?q=${encodeURIComponent(query)}`, signal);
}

// Fund estimate (single)
export async function getFundEstimate(code: string): Promise<FundEstimate> {
  return fetchJSON(`${BASE}/fund/estimate/${code}`);
}

// Fund estimate (batch)
export async function batchFundEstimate(codes: string[]): Promise<FundEstimate[]> {
  if (codes.length === 0) return [];
  return fetchJSON(`${BASE}/fund/estimate?codes=${codes.join(',')}`);
}

// Fund NAV history
export async function getFundHistory(
  code: string,
  page = 1,
  size = 30
): Promise<{ records: NavRecord[]; totalCount: number }> {
  return fetchJSON(`${BASE}/fund/history/${code}?page=${page}&size=${size}`);
}

// Fund holdings
export async function getFundHoldings(code: string): Promise<HoldingStock[]> {
  return fetchJSON(`${BASE}/fund/holdings/${code}`);
}

// Stock realtime quotes
export async function getStockQuotes(codes: string[]): Promise<StockQuote[]> {
  if (codes.length === 0) return [];
  return fetchJSON(`${BASE}/stock/realtime?codes=${codes.join(',')}`);
}

// Load imported funds from JSON file (written by /recognize-fund skill)
export async function loadImportedFunds(): Promise<ParsedFund[]> {
  const res = await fetch('/imported-funds.json?t=' + Date.now());
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error('加载识别结果失败');
  }
  const data = await res.json();
  return (data.funds || []).map((f: any) => ({ ...f, confirmed: f.confirmed ?? false }));
}

// Clear imported funds JSON file after import
export async function clearImportedFunds(): Promise<void> {
  // We can't delete a static file from the client, but we can signal it's been consumed
  // The file will be overwritten next time /recognize-fund runs
}

// Upload image to server, returns filename and absolutePath
export async function uploadImage(base64: string): Promise<{ filename: string; absolutePath: string }> {
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '上传图片失败');
  }
  return res.json();
}

// Delete uploaded image from server
export async function deleteImage(filename: string): Promise<void> {
  const res = await fetch(`${BASE}/upload/${filename}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '删除图片失败');
  }
}
