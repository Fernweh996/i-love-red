import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getFundEstimate, getFundHistory } from '@/api';
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio';
import { useWatchlistStore } from '@/stores/watchlist';
import { useToastStore } from '@/stores/toast';
import type { FundEstimate } from '@/types';
import { formatCurrency, formatNav, formatPercent, getPriceColor, getCurrentNav, getRealtimeNav, getCurrentChangeRate } from '@/lib/utils';
import NAVChart from '@/components/chart/NAVChart';
import HoldingsTable from '@/components/fund/HoldingsTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import NavSourceBadge from '@/components/shared/NavSourceBadge';

type Tab = 'chart' | 'holdings';

export default function FundDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group') || DEFAULT_GROUP_ID;
  const positions = usePortfolioStore((s) => s.positions);
  const removePosition = usePortfolioStore((s) => s.removePosition);
  const isWatching = useWatchlistStore((s) => s.isWatching(code || ''));
  const addWatch = useWatchlistStore((s) => s.addItem);
  const removeWatch = useWatchlistStore((s) => s.removeItem);
  const showToast = useToastStore((s) => s.show);

  const [estimate, setEstimate] = useState<FundEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chart');
  const [prevNav, setPrevNav] = useState<number | null>(null);

  const position = positions.find((p) => p.fundCode === code && p.groupId === groupId);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    getFundEstimate(code)
      .then(setEstimate)
      .catch(console.error)
      .finally(() => setLoading(false));
    // Fetch history to get the nav before lastNav (for 昨日收益)
    getFundHistory(code, 1, 3).then(({ records }) => {
      // records are sorted newest first; [0]=lastNav date, [1]=day before
      if (records.length >= 2) {
        setPrevNav(records[1].nav);
      }
    }).catch(() => {});
  }, [code]);

  // Derived data
  const stats = useMemo(() => {
    if (!position || !estimate) return null;
    const currentNav = getCurrentNav(estimate, estimate.lastNav);
    const realtimeNav = getRealtimeNav(estimate, estimate.lastNav);
    const lastNav = estimate.lastNav;
    const marketValue = position.shares * currentNav;
    const profit = marketValue - position.totalCost;
    const profitRate = position.totalCost > 0 ? (profit / position.totalCost) * 100 : 0;
    // 当日收益：用实时净值（含估算）
    const todayChange = position.shares * (realtimeNav - lastNav);
    const isEstimate = estimate.navSource === 'estimate';
    // 昨日收益：lastNav vs prevNav
    const yesterdayChange = prevNav !== null ? position.shares * (lastNav - prevNav) : undefined;
    const holdDays = Math.max(1, Math.floor((Date.now() - position.createTime) / 86400000));

    return { currentNav, marketValue, profit, profitRate, todayChange, isEstimate, yesterdayChange, holdDays };
  }, [position, estimate, prevNav]);

  if (!code) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'chart', label: '业绩走势' },
    { key: 'holdings', label: '重仓股' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Blue Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 text-white px-4 pt-3 pb-5">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <p className="text-[15px] font-medium leading-tight">
              {loading ? '加载中...' : estimate?.name || code}
            </p>
            <p className="text-[11px] text-blue-200 mt-0.5">{code}</p>
          </div>
          <div className="w-5" />
        </div>

        {estimate && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-blue-200 flex items-center gap-1">
                当日涨幅
                <NavSourceBadge source={estimate.navSource} />
              </p>
              <p className="text-2xl font-bold mt-0.5">
                {formatPercent(getCurrentChangeRate(estimate))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-blue-200 flex items-center justify-end gap-1">
                最新净值
                <NavSourceBadge source={estimate.navSource} />
              </p>
              <p className="text-lg font-semibold mt-0.5">
                {formatNav(getCurrentNav(estimate, estimate.lastNav))}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {position && stats && (
            <div className="bg-white mx-3 -mt-2 rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-50">
                <StatCell label="持有金额" value={formatCurrency(stats.marketValue)} />
                <StatCell label="持有份额" value={position.shares.toFixed(2)} />
                <StatCell label="持仓成本" value={formatNav(position.costNav)} />
              </div>
              <div className="border-t border-gray-50 grid grid-cols-3 divide-x divide-gray-50">
                <StatCell
                  label="持有收益"
                  value={`${stats.profit >= 0 ? '+' : ''}${formatCurrency(stats.profit)}`}
                  valueClass={getPriceColor(stats.profit)}
                />
                <StatCell
                  label="持有收益率"
                  value={formatPercent(stats.profitRate)}
                  valueClass={getPriceColor(stats.profitRate)}
                />
                <StatCell label="总投入" value={formatCurrency(position.totalCost)} />
              </div>
              <div className="border-t border-gray-50 grid grid-cols-3 divide-x divide-gray-50">
                <div className="px-3 py-3">
                  <p className="text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                    当日收益
                    {stats.isEstimate ? (
                      <span className="text-[9px] bg-orange-100 text-orange-500 px-1 py-[0.5px] rounded">估</span>
                    ) : (
                      <span className="text-[9px] bg-green-100 text-green-600 px-1 py-[0.5px] rounded">已更新</span>
                    )}
                  </p>
                  <p className={`text-[15px] font-semibold leading-tight ${getPriceColor(stats.todayChange)}`}>
                    {stats.todayChange >= 0 ? '+' : ''}{formatCurrency(stats.todayChange)}
                  </p>
                </div>
                <StatCell
                  label="昨日收益"
                  value={stats.yesterdayChange !== undefined
                    ? `${stats.yesterdayChange >= 0 ? '+' : ''}${formatCurrency(stats.yesterdayChange)}`
                    : '--'
                  }
                  valueClass={stats.yesterdayChange !== undefined ? getPriceColor(stats.yesterdayChange) : 'text-gray-400'}
                />
                <StatCell label="持有天数" value={`${stats.holdDays}`} />
              </div>
            </div>
          )}

          <div className="flex bg-white mx-3 mt-3 rounded-t-xl border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-center py-3 text-[13px] relative transition-colors ${
                  activeTab === tab.key ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="mx-3 bg-white rounded-b-xl shadow-sm mb-3 overflow-hidden">
            {activeTab === 'chart' && <NAVChart code={code} groupId={groupId} />}
            {activeTab === 'holdings' && <HoldingsTable code={code} />}
          </div>
        </>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex items-center divide-x divide-gray-100">
          {position ? (
            <>
              {/* 已持仓：修改持仓 */}
              <button
                onClick={() => navigate(`/fund/${code}/edit?group=${groupId}`)}
                className="flex-1 flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
              >
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <span className="text-[10px]">修改持仓</span>
              </button>
              {/* 已持仓：交易记录 */}
              <button
                onClick={() => showToast('功能开发中')}
                className="flex-1 flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
              >
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px]">交易记录</span>
              </button>
            </>
          ) : (
            /* 未持仓：添加持仓 */
            <button
              onClick={() => navigate(`/fund/${code}/edit?group=${groupId}`)}
              className="flex-1 flex flex-col items-center py-2.5 text-blue-600 active:bg-gray-50"
            >
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[10px]">添加持仓</span>
            </button>
          )}
          {/* 加/删自选 */}
          <button
            onClick={() => {
              if (!code) return;
              if (isWatching) {
                removeWatch(code, groupId);
                showToast('已移除自选');
              } else {
                addWatch(code, estimate?.name || position?.fundName || '', position?.fundType, groupId);
                showToast('已加入自选');
              }
            }}
            className={`flex-1 flex flex-col items-center py-2.5 active:bg-gray-50 ${isWatching ? 'text-yellow-500' : 'text-gray-600'}`}
          >
            <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill={isWatching ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span className="text-[10px]">{isWatching ? '删自选' : '加自选'}</span>
          </button>
          {/* 删除持有：仅已持仓时显示 */}
          {position && (
            <button
              onClick={() => {
                if (confirm(`确定删除 ${position.fundName} 的持仓？`)) {
                  removePosition(code, groupId);
                  showToast('已删除持仓');
                  navigate(-1);
                }
              }}
              className="flex-1 flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
            >
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span className="text-[10px]">删除持有</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Small stat cell for the 3x3 grid */
function StatCell({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="px-3 py-3">
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      <p className={`text-[15px] font-semibold leading-tight ${valueClass}`}>{value}</p>
    </div>
  );
}
