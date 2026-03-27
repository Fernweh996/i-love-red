import { useState } from 'react';
import type { PositionPnL } from '@/types';
import { formatCurrency, formatPercent, getPriceColor } from '@/lib/utils';

interface Props {
  pnlList: PositionPnL[];
  onRefresh?: () => void;
  groupLabel?: string; // e.g. "💰 理财通资产" or undefined = "账户资产"
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
    <div className="mx-3 mt-3 rounded-2xl bg-white shadow-sm p-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[11px] text-gray-400">{groupLabel || '账户资产'}</p>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                className={`text-gray-300 hover:text-gray-500 transition-transform ${refreshing ? 'animate-spin' : ''}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-[28px] font-light text-gray-800 leading-none tracking-tight">
            {formatCurrency(totalMarketValue)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-gray-400">累计收益</span>
            <span className={`text-[12px] font-medium ${getPriceColor(totalProfit)}`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </span>
            <span className={`text-[11px] ${getPriceColor(totalProfitRate)}`}>
              {formatPercent(totalProfitRate)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 mb-1.5">当日涨跌</p>
          <p className={`text-xl font-light leading-none ${getPriceColor(todayChange)}`}>
            {todayChange >= 0 ? '+' : ''}¥{formatCurrency(todayChange)}
          </p>
        </div>
      </div>
    </div>
  );
}
