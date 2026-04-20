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
