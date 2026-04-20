import Taro from '@tarojs/taro'
import type { FundInfo, FundEstimate, NavRecord, HoldingStock, StockQuote } from '@fund-manager/shared'

// TODO: Replace with actual Tencent Cloud server URL after deployment
const BASE = 'http://localhost:3001/api'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await Taro.request<T>({
    url,
    method: 'GET',
    header: { 'Content-Type': 'application/json' },
  })
  if (res.statusCode !== 200) {
    throw new Error(`API error: ${res.statusCode}`)
  }
  return res.data
}

// Fund search
export async function searchFunds(query: string): Promise<FundInfo[]> {
  if (!query.trim()) return []
  return fetchJSON(`${BASE}/fund/search?q=${encodeURIComponent(query)}`)
}

// Fund estimate (single)
export async function getFundEstimate(code: string): Promise<FundEstimate> {
  return fetchJSON(`${BASE}/fund/estimate/${code}`)
}

// Fund estimate (batch)
export async function batchFundEstimate(codes: string[]): Promise<FundEstimate[]> {
  if (codes.length === 0) return []
  return fetchJSON(`${BASE}/fund/estimate?codes=${codes.join(',')}`)
}

// Fund NAV history
export async function getFundHistory(
  code: string,
  page = 1,
  size = 30
): Promise<{ records: NavRecord[]; totalCount: number }> {
  return fetchJSON(`${BASE}/fund/history/${code}?page=${page}&size=${size}`)
}

// Fund holdings
export async function getFundHoldings(code: string): Promise<HoldingStock[]> {
  return fetchJSON(`${BASE}/fund/holdings/${code}`)
}

// Stock realtime quotes
export async function getStockQuotes(codes: string[]): Promise<StockQuote[]> {
  if (codes.length === 0) return []
  return fetchJSON(`${BASE}/stock/realtime?codes=${codes.join(',')}`)
}
