import { useState } from 'react';
import type { PositionPnL } from '@/types';
import { formatCurrency, formatPercent, getPriceColor } from '@/lib/utils';

interface Props {
  pnlList: PositionPnL[];
  onRefresh?: () => void;
  groupLabel?: string;
}

export default function ProfitSummary({ pnlList, onRefresh, groupLabel }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const totalCost = pnlList.reduce((sum, p) => sum + p.position.totalCost, 0);
  const totalMarketValue = pnlList.reduce((sum, p) => sum + p.marketValue, 0);
  const totalProfit = totalMarketValue - totalCost;
  const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const todayChange = pnlList.reduce((sum, p) => sum + p.todayChange, 0);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="px-6 pt-8 pb-6 bg-surface">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[14px] text-ink-faint tracking-label uppercase">
          {groupLabel || '资产'}
        </p>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className={`text-ink-faint hover:text-ink-secondary transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-[32px] font-medium text-ink leading-none tracking-tight tabular-nums">
        {formatCurrency(totalMarketValue)}
      </p>
      <div className="flex items-center gap-4 mt-3">
        <div>
          <span className="text-[14px] text-ink-faint tracking-label uppercase">收益</span>
          <span className={`text-[15px] font-medium ml-2 tabular-nums ${getPriceColor(totalProfit)}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </span>
          <span className={`text-[14px] ml-1 tabular-nums ${getPriceColor(totalProfitRate)}`}>
            {formatPercent(totalProfitRate)}
          </span>
        </div>
        <div>
          <span className="text-[14px] text-ink-faint tracking-label uppercase">今日</span>
          <span className={`text-[15px] font-medium ml-2 tabular-nums ${getPriceColor(todayChange)}`}>
            {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)}
          </span>
        </div>
      </div>
    </div>
  );
}
