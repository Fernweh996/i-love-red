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
 * 涨跌方向（平台无关版本）
 */
export function priceDirection(change: number): 'rise' | 'fall' | 'flat' {
  if (change > 0) return 'rise';
  if (change < 0) return 'fall';
  return 'flat';
}
