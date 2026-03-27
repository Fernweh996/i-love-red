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
      const gp = positions.filter((p) => p.groupId === group.id);
      let totalMarketValue = 0, totalCost = 0, todayChange = 0;
      let riseCount = 0, fallCount = 0, flatCount = 0;
      for (const pos of gp) {
        const est = estimates[pos.fundCode];
        const nav = getCurrentNav(est, pos.costNav);
        const last = est?.lastNav || pos.costNav;
        totalMarketValue += pos.shares * nav;
        totalCost += pos.totalCost;
        todayChange += pos.shares * (nav - last);
        const cr = getCurrentChangeRate(est);
        if (cr > 0) riseCount++; else if (cr < 0) fallCount++; else flatCount++;
      }
      const profit = totalMarketValue - totalCost;
      const profitRate = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      return { group, totalMarketValue, totalCost, profit, profitRate, todayChange, riseCount, fallCount, flatCount, totalCount: gp.length };
    });
  }, [sortedGroups, positions, estimates]);

  const overall = useMemo(() => {
    let mv = 0, cost = 0, today = 0;
    for (const s of groupStats) { mv += s.totalMarketValue; cost += s.totalCost; today += s.todayChange; }
    const profit = mv - cost;
    const rate = cost > 0 ? (profit / cost) * 100 : 0;
    return { totalMarketValue: mv, profit, profitRate: rate, todayChange: today };
  }, [groupStats]);

  return (
    <div>
      {/* Hero: total assets */}
      <div className="px-6 pt-8 pb-6 bg-surface">
        <p className="text-[11px] text-ink-tertiary tracking-label uppercase mb-2">总资产</p>
        <p className="text-[32px] font-medium text-ink leading-none tracking-tight tabular-nums">
          {formatCurrency(overall.totalMarketValue)}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div>
            <span className="text-[11px] text-ink-tertiary tracking-label uppercase">收益</span>
            <span className={`text-[15px] font-medium ml-2 tabular-nums ${getPriceColor(overall.profit)}`}>
              {overall.profit >= 0 ? '+' : ''}{formatCurrency(overall.profit)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-ink-tertiary tracking-label uppercase">今日</span>
            <span className={`text-[15px] font-medium ml-2 tabular-nums ${getPriceColor(overall.todayChange)}`}>
              {overall.todayChange >= 0 ? '+' : ''}{formatCurrency(overall.todayChange)}
            </span>
          </div>
        </div>
      </div>

      {/* Group list */}
      <div className="mt-2">
        {groupStats.map(({ group, totalMarketValue, profit, todayChange, totalCount }, index) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className="w-full flex items-center px-6 py-4 bg-surface active:bg-surface-bg transition-colors"
            style={{ marginTop: index > 0 ? 1 : 0 }}
          >
            <div className="mr-4 flex-shrink-0 opacity-60">
              <BrandIcon groupId={group.id} fallbackIcon={group.icon} size={32} />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className="text-[15px] text-ink">{group.name}</p>
              <p className="text-[11px] text-ink-tertiary mt-0.5 tracking-label">
                {totalCount} 只 · ¥{formatCurrency(totalMarketValue)}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`text-[15px] font-medium tabular-nums ${getPriceColor(todayChange)}`}>
                {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)}
              </p>
              <p className={`text-[11px] mt-0.5 tabular-nums ${getPriceColor(profit)}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </p>
            </div>

            <svg className="w-4 h-4 text-ink-faint ml-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
