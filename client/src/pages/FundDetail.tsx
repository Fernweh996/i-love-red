import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getFundEstimate } from '@/api';
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio';
import { useWatchlistStore } from '@/stores/watchlist';
import { useToastStore } from '@/stores/toast';
import type { FundEstimate } from '@/types';
import { formatCurrency, formatNav, formatPercent, getPriceColor, getCurrentNav, getCurrentChangeRate } from '@/lib/utils';
import NAVChart from '@/components/chart/NAVChart';
import HoldingsTable from '@/components/fund/HoldingsTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import NavSourceBadge from '@/components/shared/NavSourceBadge';
import GroupSelector from '@/components/shared/GroupSelector';

type Tab = 'chart' | 'holdings';

export default function FundDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group') || DEFAULT_GROUP_ID;
  const positions = usePortfolioStore((s) => s.positions);
  const addPosition = usePortfolioStore((s) => s.addPosition);
  const removePosition = usePortfolioStore((s) => s.removePosition);
  const isWatching = useWatchlistStore((s) => s.isWatching(code || ''));
  const addWatch = useWatchlistStore((s) => s.addItem);
  const removeWatch = useWatchlistStore((s) => s.removeItem);
  const showToast = useToastStore((s) => s.show);

  const [estimate, setEstimate] = useState<FundEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chart');
  const [showAddModal, setShowAddModal] = useState(false);
  const [shares, setShares] = useState('');
  const [costNav, setCostNav] = useState('');
  const [addGroupId, setAddGroupId] = useState(groupId);

  const position = positions.find((p) => p.fundCode === code && p.groupId === groupId);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    getFundEstimate(code)
      .then(setEstimate)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  // Derived data
  const stats = useMemo(() => {
    if (!position || !estimate) return null;
    const currentNav = getCurrentNav(estimate, estimate.lastNav);
    const lastNav = estimate.lastNav;
    const marketValue = position.shares * currentNav;
    const profit = marketValue - position.totalCost;
    const profitRate = position.totalCost > 0 ? (profit / position.totalCost) * 100 : 0;
    const todayChange = position.shares * (currentNav - lastNav);
    const holdDays = Math.max(1, Math.floor((Date.now() - position.createTime) / 86400000));

    return { currentNav, marketValue, profit, profitRate, todayChange, holdDays };
  }, [position, estimate]);

  if (!code) return null;

  const handleAdd = () => {
    const s = parseFloat(shares);
    const c = parseFloat(costNav);
    if (isNaN(s) || s <= 0 || isNaN(c) || c <= 0) return;
    addPosition(code, estimate?.name || position?.fundName || '', s, c, position?.fundType, addGroupId);
    setShowAddModal(false);
    setShares('');
    setCostNav('');
    showToast(position ? '加仓成功' : '已添加持仓');
  };

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
                <StatCell
                  label="当日收益"
                  value={`${stats.todayChange >= 0 ? '+' : ''}${formatCurrency(stats.todayChange)}`}
                  valueClass={getPriceColor(stats.todayChange)}
                />
                <StatCell label="净值日期" value={estimate?.lastNavDate || '--'} />
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
            {activeTab === 'chart' && <NAVChart code={code} />}
            {activeTab === 'holdings' && <HoldingsTable code={code} />}
          </div>
        </>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex items-center divide-x divide-gray-100">
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
            <span className="text-[10px]">{isWatching ? '已自选' : '加自选'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            <span className="text-[10px]">{position ? '修改持仓' : '加持仓'}</span>
          </button>
          {position && (
            <button
              onClick={() => {
                if (confirm(`确定删除 ${position.fundName} 的持仓？`)) {
                  removePosition(code, groupId);
                  showToast('已删除持仓');
                  navigate('/portfolio');
                }
              }}
              className="flex-1 flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
            >
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span className="text-[10px]">删除持仓</span>
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex flex-col items-center py-2.5 text-gray-600 active:bg-gray-50"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            <span className="text-[10px]">返回</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {position ? '加仓' : '添加持仓'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <GroupSelector value={addGroupId} onChange={setAddGroupId} />
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">持有份额</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="例: 1000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">成本净值</label>
                <input
                  type="number"
                  value={costNav}
                  onChange={(e) => setCostNav(e.target.value)}
                  placeholder="例: 1.2345"
                  step="0.0001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
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
