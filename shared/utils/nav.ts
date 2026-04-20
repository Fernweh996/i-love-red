import type { FundEstimate } from '../types';

/**
 * 获取当前最优净值（确认优先，不含盘中估算）
 * 用于持有收益等需要稳定数值的场景
 */
export function getCurrentNav(
  estimate: FundEstimate | undefined,
  fallback: number
): number {
  if (!estimate) return fallback;
  if (estimate.confirmedNav) return estimate.confirmedNav;
  if (estimate.lastNav) return estimate.lastNav;
  return fallback;
}

/**
 * 获取实时净值（含盘中估算）
 * 用于今日涨跌、当日收益等需要实时数据的场景
 * 优先级：confirmedNav → estimateNav → lastNav → fallback
 */
export function getRealtimeNav(
  estimate: FundEstimate | undefined,
  fallback: number
): number {
  if (!estimate) return fallback;
  if (estimate.confirmedNav) return estimate.confirmedNav;
  if (estimate.estimateNav) return estimate.estimateNav;
  if (estimate.lastNav) return estimate.lastNav;
  return fallback;
}

/**
 * 获取当前最优涨跌幅：confirmedChange → estimateChange
 */
export function getCurrentChangeRate(
  estimate: FundEstimate | undefined
): number {
  if (!estimate) return 0;
  if (estimate.navSource === 'confirmed' && estimate.confirmedChange !== undefined) {
    return estimate.confirmedChange;
  }
  return estimate.estimateChange || 0;
}
