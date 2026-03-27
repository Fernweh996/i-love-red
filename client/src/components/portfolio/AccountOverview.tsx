import { useMemo } from 'react';
import { usePortfolioStore } from '@/stores/portfolio';
import { useFundCacheStore } from '@/stores/fund-cache';
import { formatCurrency, formatPercent, getPriceColor, getCurrentNav, getCurrentChangeRate } from '@/lib/utils';
import type { Group } from '@/types';
import BrandIcon from '@/components/shared/BrandIcon';

interface GroupStats {
  group: Group;
  totalMarketValue: number;
  totalCost: number;
  profit: number;
  profitRate: number;
  todayChange: number;
  riseCount: number;
  fallCount: number;
  flatCount: number;
  totalCount: number;
}

interface Props {
  onGroupSelect: (groupId: string) => void;
}

export default function AccountOverview({ onGroupSelect }: Props) {
  const positions = usePortfolioStore((s) => s.positions);
  const groups = usePortfolioStore((s) => s.groups);
  const estimates = useFundCacheStore((s) => s.estimates);

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  // Calculate stats per group
  const groupStats: GroupStats[] = useMemo(() => {
    return sortedGroups.map((group) => {
      const groupPositions = positions.filter((p) => p.groupId === group.id);
      let totalMarketValue = 0;
      let totalCost = 0;
      let todayChange = 0;
      let riseCount = 0;
      let fallCount = 0;
      let flatCount = 0;

      for (const pos of groupPositions) {
        const estimate = estimates[pos.fundCode];
        const currentNav = getCurrentNav(estimate, pos.costNav);
        const lastNav = estimate?.lastNav || pos.costNav;
        const mv = pos.shares * currentNav;
        totalMarketValue += mv;
        totalCost += pos.totalCost;
        const change = pos.shares * (currentNav - lastNav);
        todayChange += change;

        const changeRate = getCurrentChangeRate(estimate);
        if (changeRate > 0) riseCount++;
        else if (changeRate < 0) fallCount++;
        else flatCount++;
      }

      const profit = totalMarketValue - totalCost;
      const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return {
        group,
        totalMarketValue,
        totalCost,
        profit,
        profitRate,
        todayChange,
        riseCount,
        fallCount,
        flatCount,
        totalCount: groupPositions.length,
      };
    });
  }, [sortedGroups, positions, estimates]);

  // Overall totals
  const overall = useMemo(() => {
    let totalMarketValue = 0;
    let totalCost = 0;
    let todayChange = 0;
    for (const s of groupStats) {
      totalMarketValue += s.totalMarketValue;
      totalCost += s.totalCost;
      todayChange += s.todayChange;
    }
    const profit = totalMarketValue - totalCost;
    const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    return { totalMarketValue, profit, profitRate, todayChange };
  }, [groupStats]);

  return (
    <div className="pb-2">
      {/* Overall summary card */}
      <div className="mx-3 mt-3 rounded-2xl bg-white shadow-sm p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[14px] text-gray-400 mb-1.5">总资产</p>
            <p className="text-[28px] font-light text-gray-800 leading-none tracking-tight">
              {formatCurrency(overall.totalMarketValue)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[14px] text-gray-400">累计收益</span>
              <span className={`text-[14px] font-medium ${getPriceColor(overall.profit)}`}>
                {overall.profit >= 0 ? '+' : ''}{formatCurrency(overall.profit)}
              </span>
              <span className={`text-[14px] ${getPriceColor(overall.profitRate)}`}>
                {formatPercent(overall.profitRate)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[14px] text-gray-400 mb-1.5">当日涨跌</p>
            <p className={`text-xl font-light leading-none ${getPriceColor(overall.todayChange)}`}>
              {overall.todayChange >= 0 ? '+' : ''}¥{formatCurrency(overall.todayChange)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-group cards */}
      <div className="px-3 pt-3 space-y-3">
        {groupStats.map(({ group, totalMarketValue, profit, profitRate, todayChange, riseCount, fallCount, totalCount }) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className="w-full bg-white rounded-2xl p-4 text-left shadow-sm active:shadow-none active:bg-gray-50/50 transition-all"
          >
            {/* Header: icon + name + count */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <BrandIcon groupId={group.id} fallbackIcon={group.icon} size={28} />
                <span className="text-[16px] font-normal text-gray-700">{group.name}</span>
                <span className="text-[12px] text-gray-300">{totalCount} 只</span>
              </div>
              <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Stats grid: 2x2 */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <p className="text-[14px] text-gray-400">账户资产</p>
                <p className="text-[16px] font-light text-gray-800">{formatCurrency(totalMarketValue)}</p>
              </div>
              <div>
                <p className="text-[14px] text-gray-400">当日收益</p>
                <p className={`text-[16px] font-light ${getPriceColor(todayChange)}`}>
                  {todayChange >= 0 ? '+' : ''}¥{formatCurrency(todayChange)}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-gray-400">持有收益</p>
                <p className={`text-[16px] font-light ${getPriceColor(profit)}`}>
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                  <span className={`text-[12px] ml-1 ${getPriceColor(profitRate)}`}>
                    {formatPercent(profitRate)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[14px] text-gray-400">涨跌分布</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {riseCount > 0 && (
                    <span className="text-[13px] font-medium text-rise">{riseCount} 涨</span>
                  )}
                  {fallCount > 0 && (
                    <span className="text-[13px] font-medium text-fall">{fallCount} 跌</span>
                  )}
                  {riseCount === 0 && fallCount === 0 && (
                    <span className="text-[13px] text-gray-300">--</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mini bar chart: rise vs fall ratio */}
            {totalCount > 0 && (
              <div className="mt-3 flex h-1 rounded-full overflow-hidden bg-gray-50">
                {riseCount > 0 && (
                  <div
                    className="bg-rise/50 transition-all"
                    style={{ width: `${(riseCount / totalCount) * 100}%` }}
                  />
                )}
                {fallCount > 0 && (
                  <div
                    className="bg-fall/50 transition-all"
                    style={{ width: `${(fallCount / totalCount) * 100}%` }}
                  />
                )}
              </div>
            )}
          </button>
        ))}

        {groupStats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[13px] text-gray-300">还没有账户，点击右上角 ⚙ 创建</p>
          </div>
        )}
      </div>
    </div>
  );
}
