/**
 * 格式化数字为金额
 */
export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(2);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 格式化净值
 */
export function formatNav(value: number): string {
  return value.toFixed(4);
}

/**
 * 涨跌颜色 (中国规则: 红涨绿跌)
 */
export function getPriceColor(change: number): string {
  if (change > 0) return 'text-rise';   // 红色
  if (change < 0) return 'text-fall';   // 绿色
  return 'text-flat';                    // 灰色
}

export function getPriceBgColor(change: number): string {
  if (change > 0) return 'bg-red-50';
  if (change < 0) return 'bg-green-50';
  return 'bg-gray-50';
}

/**
 * 判断当前是否为交易时间 (中国股市)
 */
export function isTradingTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();

  // 周末非交易日
  if (day === 0 || day === 6) return false;

  const time = hour * 100 + minute;

  // 9:30-11:30, 13:00-15:00
  return (time >= 930 && time <= 1130) || (time >= 1300 && time <= 1500);
}

/**
 * 获取轮询间隔
 * @param hasConfirmedNav 是否已有确认净值 — 收盘后如果还没公布净值则用 2min 轮询
 */
export function getPollingInterval(hasConfirmedNav?: boolean): number {
  if (isTradingTime()) return 30000; // 交易中 30s
  if (hasConfirmedNav === false) return 120000; // 收盘等待净值公布 2min
  return 300000; // 其他情况 5min
}

/**
 * 获取当前最优净值（确认优先，不含盘中估算）
 * 用于持有收益等需要稳定数值的场景
 */
export function getCurrentNav(
  estimate: import('@/types').FundEstimate | undefined,
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
  estimate: import('@/types').FundEstimate | undefined,
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
  estimate: import('@/types').FundEstimate | undefined
): number {
  if (!estimate) return 0;
  if (estimate.navSource === 'confirmed' && estimate.confirmedChange !== undefined) {
    return estimate.confirmedChange;
  }
  return estimate.estimateChange || 0;
}

/**
 * 计算加权平均成本
 */
export function calcWeightedCost(
  existingShares: number,
  existingCost: number,
  newShares: number,
  newCostNav: number
): { shares: number; costNav: number; totalCost: number } {
  const totalShares = existingShares + newShares;
  const totalCost = existingShares * existingCost + newShares * newCostNav;
  return {
    shares: totalShares,
    costNav: totalShares > 0 ? totalCost / totalShares : 0,
    totalCost,
  };
}
