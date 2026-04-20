import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import { useFundCacheStore } from '@/stores/fund-cache';
import { isTradingTime, getCurrentNav, getRealtimeNav, getCurrentChangeRate } from '@/lib/utils';
import type { PositionPnL } from '@/types';
import ProfitSummary from './ProfitSummary';
import PositionCard from './PositionCard';
import GroupTabs from './GroupTabs';
import AccountOverview from './AccountOverview';
import PullToRefresh from '@/components/shared/PullToRefresh';
import EmptyState from '@/components/shared/EmptyState';
import { batchFundEstimate, getFundHistory } from '@/api';

type SortKey = 'todayChangeRate' | 'profit' | 'marketValue';

function TradingStatus({ hasConfirmedNav }: { hasConfirmedNav: boolean }) {
  const trading = isTradingTime();
  let dotClass: string;
  let label: string;

  if (trading) {
    dotClass = 'bg-fall animate-pulse';
    label = '交易中';
  } else if (hasConfirmedNav) {
    dotClass = 'bg-ink-faint';
    label = '已收盘 · 净值已更新';
  } else {
    dotClass = 'bg-ink-faint';
    label = '已收盘 · 等待净值';
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      <span className={`w-1 h-1 rounded-full ${dotClass}`} />
      <span className="text-[14px] text-ink-faint tracking-label">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const positions = usePortfolioStore((s) => s.positions);
  const activeGroupId = usePortfolioStore((s) => s.activeGroupId);
  const setActiveGroupId = usePortfolioStore((s) => s.setActiveGroupId);
  const groups = usePortfolioStore((s) => s.groups);
  const estimates = useFundCacheStore((s) => s.estimates);
  const weekNavs = useFundCacheStore((s) => s.weekNavs);
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('todayChangeRate');
  const [sortAsc, setSortAsc] = useState(false);

  const groupLabel = useMemo(() => {
    if (activeGroupId === 'all') return undefined;
    const g = groups.find((g) => g.id === activeGroupId);
    return g ? g.name : undefined;
  }, [activeGroupId, groups]);

  const filteredPositions = useMemo(() => {
    if (activeGroupId === 'all') return positions;
    return positions.filter((p) => p.groupId === activeGroupId);
  }, [positions, activeGroupId]);

  const pnlList: PositionPnL[] = useMemo(() => {
    const list = filteredPositions.map((pos) => {
      const est = estimates[pos.fundCode];
      const nav = getCurrentNav(est, pos.costNav);
      const realtimeNav = getRealtimeNav(est, pos.costNav);
      const last = est?.lastNav || pos.costNav;
      const mv = pos.shares * nav;
      const profit = mv - pos.totalCost;
      const profitRate = pos.totalCost > 0 ? (profit / pos.totalCost) * 100 : 0;
      const todayChange = pos.shares * (realtimeNav - last);
      const todayChangeRate = getCurrentChangeRate(est);
      const weekNav = weekNavs[pos.fundCode];
      const weekProfit = weekNav ? pos.shares * (nav - weekNav) : undefined;
      return { position: pos, currentNav: nav, marketValue: mv, profit, profitRate, todayChange, todayChangeRate, estimate: est, weekProfit };
    });
    list.sort((a, b) => sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);
    return list;
  }, [filteredPositions, estimates, weekNavs, sortKey, sortAsc]);

  const totalMarketValue = useMemo(() => pnlList.reduce((sum, p) => sum + p.marketValue, 0), [pnlList]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleRefresh = async () => {
    const codes = [...new Set(positions.map((p) => p.fundCode))];
    if (codes.length === 0) return;
    const estimatesData = batchFundEstimate(codes);

    // Fetch week-start navs (last Friday's close) for all funds
    const weekNavPromises = codes.map(async (code) => {
      try {
        const { records } = await getFundHistory(code, 1, 7);
        // Find the nav from last week's last trading day (>= 5 calendar days ago)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        // Go back to previous Friday: if today is Mon(1), go back 3 days; Tue(2) 4 days; etc.
        const daysBack = dayOfWeek === 0 ? 2 : dayOfWeek === 6 ? 1 : dayOfWeek + 2;
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - daysBack);
        const weekStartStr = weekStart.toISOString().slice(0, 10);

        // Find the closest record on or before weekStart
        const sorted = records.sort((a, b) => b.date.localeCompare(a.date));
        const weekRec = sorted.find((r) => r.date <= weekStartStr);
        return { code, nav: weekRec?.nav };
      } catch {
        return { code, nav: undefined };
      }
    });

    const [estResult, ...weekResults] = await Promise.all([estimatesData, ...weekNavPromises]);
    useFundCacheStore.getState().setEstimates(estResult);

    const newWeekNavs: Record<string, number> = {};
    for (const r of weekResults) {
      if (r.nav) newWeekNavs[r.code] = r.nav;
    }
    useFundCacheStore.getState().setWeekNavs(newWeekNavs);
  };

  // Fetch week navs on initial mount (if not already loaded)
  useEffect(() => {
    const codes = [...new Set(positions.map((p) => p.fundCode))];
    if (codes.length === 0) return;
    const currentWeekNavs = useFundCacheStore.getState().weekNavs;
    const missing = codes.filter((c) => !(c in currentWeekNavs));
    if (missing.length === 0) return;

    const fetchWeekNavs = async () => {
      const results = await Promise.all(
        missing.map(async (code) => {
          try {
            const { records } = await getFundHistory(code, 1, 7);
            const now = new Date();
            const dayOfWeek = now.getDay();
            const daysBack = dayOfWeek === 0 ? 2 : dayOfWeek === 6 ? 1 : dayOfWeek + 2;
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - daysBack);
            const weekStartStr = weekStart.toISOString().slice(0, 10);
            const sorted = records.sort((a, b) => b.date.localeCompare(a.date));
            const weekRec = sorted.find((r) => r.date <= weekStartStr);
            return { code, nav: weekRec?.nav };
          } catch {
            return { code, nav: undefined };
          }
        })
      );
      const navs: Record<string, number> = {};
      for (const r of results) {
        if (r.nav) navs[r.code] = r.nav;
      }
      useFundCacheStore.getState().setWeekNavs(navs);
    };
    fetchWeekNavs();
  }, [positions]);

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span className="inline-flex flex-col ml-0.5 leading-none">
      <span className={`text-[7px] leading-none ${active && !asc ? 'text-ink' : 'text-ink-faint'}`}>▲</span>
      <span className={`text-[7px] leading-none ${active && asc ? 'text-ink' : 'text-ink-faint'}`}>▼</span>
    </span>
  );

  const importGroupId = activeGroupId === 'all' ? (groups[0]?.id || 'licaitong') : activeGroupId;

  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingRef = useRef(false);
  const registerScrollRef = useCallback((i: number) => (el: HTMLDivElement | null) => { scrollRefs.current[i] = el; }, []);
  const handleSyncScroll = useCallback((src: number) => () => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    const s = scrollRefs.current[src];
    if (!s) { isScrollingRef.current = false; return; }
    scrollRefs.current.forEach((el, i) => { if (el && i !== src) el.scrollLeft = s.scrollLeft; });
    isScrollingRef.current = false;
  }, []);

  if (activeGroupId === 'all') {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <GroupTabs activeGroupId={activeGroupId} onGroupChange={setActiveGroupId} />
        <AccountOverview onGroupSelect={setActiveGroupId} />
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <GroupTabs activeGroupId={activeGroupId} onGroupChange={setActiveGroupId} />
      <ProfitSummary pnlList={pnlList} groupLabel={groupLabel} />
      <TradingStatus hasConfirmedNav={pnlList.some((p) => p.estimate?.navSource === 'confirmed')} />

      {/* Column header */}
      <div className="flex items-center px-6 bg-surface min-h-[32px]">
        <div className="w-[140px] flex-shrink-0 pr-4">
          <span className="text-[14px] text-ink-faint tracking-label uppercase">名称</span>
        </div>
        <div className="flex-1 overflow-x-auto scrollbar-hide" ref={registerScrollRef(0)} onScroll={handleSyncScroll(0)}>
          <div className="flex items-center min-w-max">
            <button className="w-[96px] flex-shrink-0 text-center flex items-center justify-center" onClick={() => handleSort('todayChangeRate')}>
              <span className="text-[14px] text-ink-faint tracking-label uppercase">今日涨跌</span>
              <SortIcon active={sortKey === 'todayChangeRate'} asc={sortAsc} />
            </button>
            <button className="w-[96px] flex-shrink-0 text-center flex items-center justify-center" onClick={() => handleSort('profit')}>
              <span className="text-[14px] text-ink-faint tracking-label uppercase">持有收益</span>
              <SortIcon active={sortKey === 'profit'} asc={sortAsc} />
            </button>
            <div className="w-[96px] flex-shrink-0 text-center">
              <span className="text-[14px] text-ink-faint tracking-label uppercase">本周收益</span>
            </div>
            <div className="w-[72px] flex-shrink-0 text-center">
              <span className="text-[14px] text-ink-faint tracking-label uppercase">持仓占比</span>
            </div>
            <div className="w-[80px] flex-shrink-0 text-center">
              <span className="text-[14px] text-ink-faint tracking-label uppercase">净值</span>
            </div>
            <div className="w-[88px] flex-shrink-0 text-center">
              <span className="text-[14px] text-ink-faint tracking-label uppercase">份额</span>
            </div>
            <div className="w-[80px] flex-shrink-0 text-center">
              <span className="text-[14px] text-ink-faint tracking-label uppercase">成本</span>
            </div>
          </div>
        </div>
      </div>

      {filteredPositions.length === 0 ? (
        <EmptyState icon="📭" title="暂无持仓" description="添加持仓或截图导入" />
      ) : (
        <div key={activeGroupId} className="bg-surface animate-fade-in-up">
          {pnlList.map((pnl, i) => (
            <PositionCard
              key={`${pnl.position.fundCode}-${pnl.position.groupId}`}
              pnl={pnl}
              totalMarketValue={totalMarketValue}
              scrollRef={registerScrollRef(i + 1)}
              onScroll={handleSyncScroll(i + 1)}
              isLast={i === pnlList.length - 1}
            />
          ))}
        </div>
      )}

      {/* Actions — minimal text links */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
            className="text-[15px] text-accent tracking-label uppercase active:text-ink transition-colors"
          >
            + 添加
          </button>
          <button
            onClick={() => navigate(`/import?group=${importGroupId}`)}
            className="text-[15px] text-accent tracking-label uppercase active:text-ink transition-colors"
          >
            截图导入
          </button>
        </div>
        <span className="text-[14px] text-ink-faint">← 滑动删除</span>
      </div>
    </PullToRefresh>
  );
}
