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

      return { group, totalMarketValue, totalCost, profit, profitRate, todayChange, riseCount, fallCount, flatCount, totalCount: groupPositions.length };
    });
  }, [sortedGroups, positions, estimates]);

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
      {/* Overall summary — iOS large header style */}
      <div className="mx-4 mt-3 rounded-2xl bg-white p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[14px] text-ios-gray mb-1">总资产（元）</p>
            <p className="text-[34px] font-semibold text-ios-label leading-none tracking-tight">
              {formatCurrency(overall.totalMarketValue)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[14px] text-ios-gray">累计收益</span>
              <span className={`text-[14px] font-medium ${getPriceColor(overall.profit)}`}>
                {overall.profit >= 0 ? '+' : ''}{formatCurrency(overall.profit)}
              </span>
              <span className={`text-[14px] ${getPriceColor(overall.profitRate)}`}>
                {formatPercent(overall.profitRate)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[14px] text-ios-gray mb-1">今日</p>
            <p className={`text-[22px] font-semibold leading-none ${getPriceColor(overall.todayChange)}`}>
              {overall.todayChange >= 0 ? '+' : ''}¥{formatCurrency(overall.todayChange)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-group cards — iOS list style */}
      <div className="mx-4 mt-3 rounded-2xl bg-white overflow-hidden">
        {groupStats.map(({ group, totalMarketValue, profit, profitRate, todayChange, riseCount, fallCount, totalCount }, index) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`w-full p-4 text-left active:bg-ios-fill/30 transition-colors flex items-center ${
              index > 0 ? 'border-t border-ios-separator/20' : ''
            }`}
          >
            {/* Left: icon */}
            <div className="mr-3 flex-shrink-0">
              <BrandIcon groupId={group.id} fallbackIcon={group.icon} size={36} />
            </div>

            {/* Center: name + stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-medium text-ios-label">{group.name}</span>
                <span className="text-[14px] text-ios-gray">{totalCount} 只</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[14px] text-ios-gray">
                  ¥{formatCurrency(totalMarketValue)}
                </span>
                <span className={`text-[14px] ${getPriceColor(profit)}`}>
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </span>
                {(riseCount > 0 || fallCount > 0) && (
                  <span className="text-[12px] text-ios-gray">
                    {riseCount > 0 && <span className="text-rise">{riseCount}↑</span>}
                    {riseCount > 0 && fallCount > 0 && ' '}
                    {fallCount > 0 && <span className="text-fall">{fallCount}↓</span>}
                  </span>
                )}
              </div>
            </div>

            {/* Right: today change + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[16px] font-medium ${getPriceColor(todayChange)}`}>
                {todayChange >= 0 ? '+' : ''}¥{formatCurrency(todayChange)}
              </span>
              <svg className="w-4 h-4 text-ios-gray/40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        ))}

        {groupStats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[15px] text-ios-gray">还没有账户，点击右上角管理创建</p>
          </div>
        )}
      </div>
    </div>
  );
}
