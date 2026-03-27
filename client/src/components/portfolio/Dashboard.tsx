import { useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import { useFundCacheStore } from '@/stores/fund-cache';
import { isTradingTime, getCurrentNav, getCurrentChangeRate } from '@/lib/utils';
import type { PositionPnL } from '@/types';
import ProfitSummary from './ProfitSummary';
import PositionCard from './PositionCard';
import GroupTabs from './GroupTabs';
import AccountOverview from './AccountOverview';
import PullToRefresh from '@/components/shared/PullToRefresh';
import EmptyState from '@/components/shared/EmptyState';
import { batchFundEstimate } from '@/api';

type SortKey = 'todayChange' | 'profit' | 'marketValue';

function TradingStatus({ hasConfirmedNav }: { hasConfirmedNav: boolean }) {
  const trading = isTradingTime();

  let dotClass: string;
  let label: string;

  if (trading) {
    dotClass = 'bg-morandi-green animate-pulse';
    label = '交易中 · 估值实时刷新';
  } else if (hasConfirmedNav) {
    dotClass = 'bg-morandi-pink';
    label = '已收盘 · 已更新今日净值';
  } else {
    dotClass = 'bg-gray-200';
    label = '已收盘 · 等待净值公布';
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-2 mx-3 rounded-xl bg-white/50">
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span className="text-[14px] text-gray-500">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const positions = usePortfolioStore((s) => s.positions);
  const activeGroupId = usePortfolioStore((s) => s.activeGroupId);
  const setActiveGroupId = usePortfolioStore((s) => s.setActiveGroupId);
  const groups = usePortfolioStore((s) => s.groups);
  const estimates = useFundCacheStore((s) => s.estimates);
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('todayChange');
  const [sortAsc, setSortAsc] = useState(false);

  // Build group label for ProfitSummary
  const groupLabel = useMemo(() => {
    if (activeGroupId === 'all') return undefined;
    const group = groups.find((g) => g.id === activeGroupId);
    return group ? `${group.icon} ${group.name}资产` : undefined;
  }, [activeGroupId, groups]);

  // Filter positions by active group
  const filteredPositions = useMemo(() => {
    if (activeGroupId === 'all') return positions;
    return positions.filter((p) => p.groupId === activeGroupId);
  }, [positions, activeGroupId]);

  // Calculate P&L for each position
  const pnlList: PositionPnL[] = useMemo(() => {
    const list = filteredPositions.map((pos) => {
      const estimate = estimates[pos.fundCode];
      const currentNav = getCurrentNav(estimate, pos.costNav);
      const lastNav = estimate?.lastNav || pos.costNav;
      const marketValue = pos.shares * currentNav;
      const profit = marketValue - pos.totalCost;
      const profitRate = pos.totalCost > 0 ? (profit / pos.totalCost) * 100 : 0;
      const todayChange = pos.shares * (currentNav - lastNav);
      const todayChangeRate = getCurrentChangeRate(estimate);

      return {
        position: pos,
        currentNav,
        marketValue,
        profit,
        profitRate,
        todayChange,
        todayChangeRate,
        estimate,
      };
    });

    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      return sortAsc ? va - vb : vb - va;
    });

    return list;
  }, [filteredPositions, estimates, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const handleRefresh = async () => {
    const codes = [...new Set(positions.map((p) => p.fundCode))];
    if (codes.length === 0) return;
    const data = await batchFundEstimate(codes);
    useFundCacheStore.getState().setEstimates(data);
  };

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span className={`inline-flex flex-col ml-0.5 leading-none`}>
      <span className={`text-[8px] leading-none ${active && !asc ? 'text-morandi-blue' : 'text-gray-200'}`}>▲</span>
      <span className={`text-[8px] leading-none ${active && asc ? 'text-morandi-blue' : 'text-gray-200'}`}>▼</span>
    </span>
  );

  // Determine import target group
  const importGroupId = activeGroupId === 'all'
    ? (groups.length > 0 ? groups[0].id : 'licaitong')
    : activeGroupId;

  // Synchronized horizontal scroll for header + all cards
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingRef = useRef(false);

  const registerScrollRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    scrollRefs.current[index] = el;
  }, []);

  const handleSyncScroll = useCallback((sourceIndex: number) => () => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    const source = scrollRefs.current[sourceIndex];
    if (!source) { isScrollingRef.current = false; return; }
    const left = source.scrollLeft;
    scrollRefs.current.forEach((el, i) => {
      if (el && i !== sourceIndex) el.scrollLeft = left;
    });
    isScrollingRef.current = false;
  }, []);

  // ---- "账户汇总" view: show per-group overview cards ----
  if (activeGroupId === 'all') {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pb-2">
          <GroupTabs
            activeGroupId={activeGroupId}
            onGroupChange={setActiveGroupId}
          />
          <AccountOverview onGroupSelect={setActiveGroupId} />
        </div>
      </PullToRefresh>
    );
  }

  // ---- Single group view: show fund list ----
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-2">
        <GroupTabs
          activeGroupId={activeGroupId}
          onGroupChange={setActiveGroupId}
        />
        <ProfitSummary pnlList={pnlList} groupLabel={groupLabel} />

        <div className="mt-2">
          <TradingStatus hasConfirmedNav={pnlList.some((p) => p.estimate?.navSource === 'confirmed')} />
        </div>

        {/* Column Header */}
        <div className="flex items-center px-4 mx-3 mt-2 mb-1 min-h-[32px]">
          <div className="w-[140px] flex-shrink-0 pr-3">
            <span className="text-[14px] text-gray-500">基金名称</span>
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-hide" ref={registerScrollRef(0)} onScroll={handleSyncScroll(0)}>
            <div className="flex items-center min-w-max">
              <button
                className="w-[100px] flex-shrink-0 text-center flex items-center justify-center"
                onClick={() => handleSort('todayChange')}
              >
                <span className="text-[14px] text-gray-500">当日涨跌</span>
                <SortIcon active={sortKey === 'todayChange'} asc={sortAsc} />
              </button>
              <button
                className="w-[100px] flex-shrink-0 text-center flex items-center justify-center"
                onClick={() => handleSort('profit')}
              >
                <span className="text-[14px] text-gray-500">持有收益</span>
                <SortIcon active={sortKey === 'profit'} asc={sortAsc} />
              </button>
              <div className="w-[80px] flex-shrink-0 text-center">
                <span className="text-[14px] text-gray-500">最新净值</span>
              </div>
              <div className="w-[90px] flex-shrink-0 text-center">
                <span className="text-[14px] text-gray-500">持有份额</span>
              </div>
              <div className="w-[80px] flex-shrink-0 text-center">
                <span className="text-[14px] text-gray-500">成本净值</span>
              </div>
            </div>
          </div>
        </div>

        {/* Position List */}
        {filteredPositions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="该账户暂无持仓"
            description="点击下方添加持仓或截图导入"
          />
        ) : (
          <div key={activeGroupId} className="px-3 space-y-2.5 animate-fade-in-up">
            {pnlList.map((pnl, index) => (
              <PositionCard
                key={`${pnl.position.fundCode}-${pnl.position.groupId}`}
                pnl={pnl}
                scrollRef={registerScrollRef(index + 1)}
                onScroll={handleSyncScroll(index + 1)}
              />
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center justify-between px-3 py-3 mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-search'));
              }}
              className="text-[14px] text-morandi-blue bg-morandi-blue/10 px-4 py-2 rounded-xl active:bg-morandi-blue/20 transition-colors"
            >
              + 添加持仓
            </button>
            <button
              onClick={() => navigate(`/import?group=${importGroupId}`)}
              className="text-[14px] text-morandi-pink bg-morandi-pink/10 px-4 py-2 rounded-xl active:bg-morandi-pink/20 transition-colors"
            >
              📷 截图导入
            </button>
          </div>
          <span className="text-[10px] text-gray-200">← 左滑可删除</span>
        </div>
      </div>
    </PullToRefresh>
  );
}
