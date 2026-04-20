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
