# 基金管理 V2 迭代优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add watchlist feature, restructure layout (search overlay + market index bar + 2-tab bar), improve UX (toast, animations, pull-to-refresh), and fix group-related bugs.

**Architecture:** AppShell becomes the shared layer hosting search bar, market index bar, toast, and `useFundEstimate`. Two bottom tabs (持有/自选) share this context. Search moves from a standalone page to a full-screen overlay. Import entry moves into per-group actions in Dashboard.

**Tech Stack:** React 18, Zustand 4, Tailwind 3, Recharts, Vite 5, Express

**Spec:** `docs/superpowers/specs/2026-03-25-v2-iteration-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `stores/watchlist.ts` | Watchlist zustand store with persist |
| `stores/toast.ts` | Global toast state |
| `hooks/useMarketIndex.ts` | Market index polling hook |
| `components/shared/Toast.tsx` | Toast UI component |
| `components/shared/SearchOverlay.tsx` | Full-screen search overlay |
| `components/shared/MarketIndexBar.tsx` | Market index display bar |
| `components/shared/PullToRefresh.tsx` | Pull-to-refresh wrapper |
| `components/shared/GroupSelector.tsx` | Shared group selector chips |
| `pages/Watchlist.tsx` | Watchlist page |

### Modified Files
| File | Changes |
|------|---------|
| `types/index.ts` | Add `WatchItem` type |
| `hooks/useFundEstimate.ts` | Merge watchlist + portfolio codes |
| `components/layout/AppShell.tsx` | Add search bar, market index, toast, lift useFundEstimate |
| `components/layout/TabBar.tsx` | 2 tabs: 持有/自选 |
| `components/portfolio/Dashboard.tsx` | Group animation, pull-to-refresh, bottom buttons |
| `components/portfolio/ProfitSummary.tsx` | Group name in title |
| `pages/FundDetail.tsx` | Add watchlist button + group selector in modal |
| `pages/Import.tsx` | Read groupId from URL, show target group |
| `App.tsx` | Routes: add /watchlist, remove /search |

### Removed Files
| File | Reason |
|------|--------|
| `pages/Search.tsx` | Replaced by SearchOverlay |
| `components/layout/Header.tsx` | Dead code |

---

## Task 1: Add WatchItem type + Toast store + Watchlist store

**Files:**
- Modify: `client/src/types/index.ts`
- Create: `client/src/stores/toast.ts`
- Create: `client/src/stores/watchlist.ts`

- [ ] **Step 1: Add WatchItem type**

In `client/src/types/index.ts`, add after the `ParsedFund` interface:

```ts
// 自选基金
export interface WatchItem {
  fundCode: string;
  fundName: string;
  fundType?: string;
  addTime: number;
}
```

- [ ] **Step 2: Create toast store**

Create `client/src/stores/toast.ts`:

```ts
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    setTimeout(() => set({ message: null }), 2000);
  },
  hide: () => set({ message: null }),
}));
```

- [ ] **Step 3: Create watchlist store**

Create `client/src/stores/watchlist.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchItem } from '@/types';

interface WatchlistState {
  items: WatchItem[];
  addItem: (fundCode: string, fundName: string, fundType?: string) => void;
  removeItem: (fundCode: string) => void;
  isWatching: (fundCode: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (fundCode, fundName, fundType) => {
        if (get().items.some((i) => i.fundCode === fundCode)) return;
        set((state) => ({
          items: [...state.items, { fundCode, fundName, fundType, addTime: Date.now() }],
        }));
      },

      removeItem: (fundCode) => {
        set((state) => ({
          items: state.items.filter((i) => i.fundCode !== fundCode),
        }));
      },

      isWatching: (fundCode) => {
        return get().items.some((i) => i.fundCode === fundCode);
      },
    }),
    { name: 'fund-manager-watchlist' }
  )
);
```

- [ ] **Step 4: Verify types compile**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager && npx tsc --noEmit --project client/tsconfig.json`
Expected: No errors

---

## Task 2: Toast UI component

**Files:**
- Create: `client/src/components/shared/Toast.tsx`

- [ ] **Step 1: Create Toast component**

Create `client/src/components/shared/Toast.tsx`:

```tsx
import { useToastStore } from '@/stores/toast';

export default function Toast() {
  const message = useToastStore((s) => s.message);

  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-toast-up">
      <div className="bg-gray-800 text-white text-[13px] px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add toast animation to index.css**

In `client/src/index.css`, add after the existing `@keyframes slide-up`:

```css
/* Toast slide-up + fade */
@keyframes toast-up {
  from { opacity: 0; transform: translateY(20px) translateX(-50%); }
  to { opacity: 1; transform: translateY(0) translateX(-50%); }
}
.animate-toast-up {
  animation: toast-up 0.25s ease-out;
}

/* Fade in for group switching */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.15s ease-out;
}
```

---

## Task 3: Market index hook + component

**Files:**
- Create: `client/src/hooks/useMarketIndex.ts`
- Create: `client/src/components/shared/MarketIndexBar.tsx`

- [ ] **Step 1: Create useMarketIndex hook**

Create `client/src/hooks/useMarketIndex.ts`:

```ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { getStockQuotes } from '@/api';
import { isTradingTime } from '@/lib/utils';
import type { StockQuote } from '@/types';

const INDEX_CODES = ['sh000001', 'sz399001', 'sz399006'];

export function useMarketIndex() {
  const [indices, setIndices] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getStockQuotes(INDEX_CODES);
      setIndices(data);
    } catch {
      // Silent fail — bar just stays hidden or shows stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();

    const interval = isTradingTime() ? 30000 : 300000;
    timerRef.current = setInterval(fetch, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch]);

  return { indices, loading, refresh: fetch };
}
```

- [ ] **Step 2: Create MarketIndexBar component**

Create `client/src/components/shared/MarketIndexBar.tsx`:

```tsx
import { useMarketIndex } from '@/hooks/useMarketIndex';
import { getPriceColor } from '@/lib/utils';

const INDEX_NAMES: Record<string, string> = {
  sh000001: '上证',
  sz399001: '深证',
  sz399006: '创业板',
};

export default function MarketIndexBar() {
  const { indices, loading } = useMarketIndex();

  if (loading && indices.length === 0) {
    return (
      <div className="flex items-center justify-around px-4 py-1.5 bg-white border-b border-gray-50">
        {['上证', '深证', '创业板'].map((name) => (
          <div key={name} className="text-center">
            <span className="text-[10px] text-gray-400">{name}</span>
            <span className="text-[11px] text-gray-300 ml-1">--</span>
          </div>
        ))}
      </div>
    );
  }

  if (indices.length === 0) return null;

  return (
    <div className="flex items-center justify-around px-4 py-1.5 bg-white border-b border-gray-50">
      {indices.map((idx) => (
        <div key={idx.code} className="text-center flex items-center gap-1">
          <span className="text-[10px] text-gray-400">{INDEX_NAMES[idx.code] || idx.name}</span>
          <span className={`text-[11px] font-medium ${getPriceColor(idx.changeRate)}`}>
            {idx.price.toFixed(0)}
          </span>
          <span className={`text-[10px] ${getPriceColor(idx.changeRate)}`}>
            {idx.changeRate > 0 ? '+' : ''}{idx.changeRate.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify compile**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager && npx tsc --noEmit --project client/tsconfig.json`

---

## Task 4: SearchOverlay + GroupSelector

**Files:**
- Create: `client/src/components/shared/SearchOverlay.tsx`
- Create: `client/src/components/shared/GroupSelector.tsx`

- [ ] **Step 1: Create GroupSelector**

Create `client/src/components/shared/GroupSelector.tsx`:

```tsx
import { usePortfolioStore } from '@/stores/portfolio';

interface Props {
  value: string;
  onChange: (groupId: string) => void;
}

export default function GroupSelector({ value, onChange }: Props) {
  const groups = usePortfolioStore((s) => s.groups);
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">选择分组</label>
      <div className="flex flex-wrap gap-2">
        {sortedGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
              value === g.id
                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SearchOverlay**

Create `client/src/components/shared/SearchOverlay.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFundSearch } from '@/hooks/useFundSearch';
import type { FundInfo } from '@/types';

interface Props {
  onClose: () => void;
}

function fundTypeColor(type: string): string {
  if (type.includes('指数')) return 'bg-purple-50 text-purple-500';
  if (type.includes('混合')) return 'bg-blue-50 text-blue-500';
  if (type.includes('股票')) return 'bg-red-50 text-red-500';
  if (type.includes('债券')) return 'bg-green-50 text-green-600';
  if (type.includes('货币')) return 'bg-gray-100 text-gray-500';
  if (type.includes('QDII')) return 'bg-orange-50 text-orange-500';
  return 'bg-gray-100 text-gray-500';
}

export default function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const { results, loading } = useFundSearch(query);
  const navigate = useNavigate();

  const handleSelect = (fund: FundInfo) => {
    onClose();
    navigate(`/fund/${fund.code}`);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Search header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3 py-2.5">
          <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入基金代码、名称或拼音"
            className="flex-1 text-sm outline-none bg-transparent"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />
          )}
        </div>
        <button onClick={onClose} className="text-[14px] text-gray-500 flex-shrink-0">
          取消
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() && (
          <p className="text-center text-xs text-gray-400 mt-8">支持基金代码、名称、拼音搜索</p>
        )}
        {results.map((fund) => {
          const shortType = fund.type.replace(/型.*$/, '').slice(0, 4);
          return (
            <button
              key={fund.code}
              className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 border-b border-gray-50"
              onClick={() => handleSelect(fund)}
            >
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{fund.name}</p>
                  <span className={`flex-shrink-0 text-[9px] px-1.5 py-[1px] rounded ${fundTypeColor(fund.type)}`}>
                    {shortType}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{fund.code}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify compile**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager && npx tsc --noEmit --project client/tsconfig.json`

---

## Task 5: PullToRefresh component

**Files:**
- Create: `client/src/components/shared/PullToRefresh.tsx`

- [ ] **Step 1: Create PullToRefresh**

Create `client/src/components/shared/PullToRefresh.tsx`:

```tsx
import { useRef, useState, type ReactNode } from 'react';

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: Props) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 60;

  const onTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pullingRef.current || refreshing) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      // Dampen the pull (50% resistance)
      setPullDistance(Math.min(dy * 0.5, THRESHOLD * 1.5));
    }
  };

  const onTouchEnd = async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        {refreshing ? (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-[11px] text-gray-400">
            {pullDistance >= THRESHOLD ? '松手刷新' : '下拉刷新'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
```

---

## Task 6: Watchlist page

**Depends on:** Task 1, 2, 5

**Files:**
- Create: `client/src/pages/Watchlist.tsx`

- [ ] **Step 1: Create Watchlist page**

Create `client/src/pages/Watchlist.tsx`:

```tsx
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlistStore } from '@/stores/watchlist';
import { useFundCacheStore } from '@/stores/fund-cache';
import { formatPercent, getPriceColor, getCurrentNav, getCurrentChangeRate } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';
import PullToRefresh from '@/components/shared/PullToRefresh';
import { useToastStore } from '@/stores/toast';

interface WatchCardProps {
  fundCode: string;
  fundName: string;
  fundType?: string;
  onRemove: () => void;
  onClick: () => void;
}

function WatchCard({ fundCode, fundName, fundType, onRemove, onClick }: WatchCardProps) {
  const estimate = useFundCacheStore((s) => s.estimates[fundCode]);
  const currentNav = getCurrentNav(estimate, 0);
  const changeRate = getCurrentChangeRate(estimate);

  // Swipe state
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const DELETE_THRESHOLD = 72;

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startOffsetRef.current = offsetX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const next = Math.max(-DELETE_THRESHOLD, Math.min(0, startOffsetRef.current + dx));
    setOffsetX(next);
  };

  const onTouchEnd = () => {
    setSwiping(false);
    setOffsetX(offsetX < -DELETE_THRESHOLD / 2 ? -DELETE_THRESHOLD : 0);
  };

  const typeLabel = fundType ? fundType.replace(/型.*$/, '').slice(0, 4) : '';

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-red-500">
        <button onClick={onRemove} className="text-white text-xs font-medium w-full h-full">移除</button>
      </div>
      <div
        className="relative bg-white flex items-center min-h-[56px] px-4 active:bg-gray-50 transition-transform"
        style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease-out' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (offsetX < -10) { setOffsetX(0); return; } onClick(); }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-medium text-gray-800 truncate">{fundName}</p>
            {typeLabel && (
              <span className="flex-shrink-0 text-[9px] text-blue-500 bg-blue-50 px-1 py-[1px] rounded">{typeLabel}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{fundCode}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-[15px] font-bold ${getPriceColor(changeRate)}`}>
            {formatPercent(changeRate)}
          </span>
          <span className="text-[13px] text-gray-600 w-[60px] text-right">
            {currentNav > 0 ? currentNav.toFixed(4) : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const items = useWatchlistStore((s) => s.items);
  const removeItem = useWatchlistStore((s) => s.removeItem);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();

  // Expose refresh via context (will be called by AppShell)
  const handleRefresh = async () => {
    // Refresh is handled by AppShell's useFundEstimate
    // Just await a tick for animation
    await new Promise((r) => setTimeout(r, 500));
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="还没有自选基金"
        description="去搜索页面添加你关注的基金吧"
      />
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-2">
        {/* Column header */}
        <div className="flex items-center px-4 bg-white border-b border-gray-50 min-h-[32px]">
          <span className="flex-1 text-[11px] text-gray-400">基金名称</span>
          <span className="text-[11px] text-gray-400 w-[80px] text-center">涨跌幅</span>
          <span className="text-[11px] text-gray-400 w-[60px] text-right">净值</span>
        </div>

        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <WatchCard
              key={item.fundCode}
              fundCode={item.fundCode}
              fundName={item.fundName}
              fundType={item.fundType}
              onRemove={() => {
                removeItem(item.fundCode);
                showToast('已移除自选');
              }}
              onClick={() => navigate(`/fund/${item.fundCode}`)}
            />
          ))}
        </div>

        <div className="px-4 py-3 bg-white mt-px">
          <span className="text-[10px] text-gray-300">← 左滑可移除</span>
        </div>
      </div>
    </PullToRefresh>
  );
}
```

---

## Task 7: Restructure AppShell + TabBar + Routes

**Depends on:** Task 1, 2, 3, 4

**Files:**
- Modify: `client/src/components/layout/AppShell.tsx`
- Modify: `client/src/components/layout/TabBar.tsx`
- Modify: `client/src/App.tsx`
- Delete: `client/src/components/layout/Header.tsx`
- Delete: `client/src/pages/Search.tsx`

- [ ] **Step 1: Rewrite AppShell**

Replace `client/src/components/layout/AppShell.tsx` with:

```tsx
import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TabBar from './TabBar';
import MarketIndexBar from '@/components/shared/MarketIndexBar';
import SearchOverlay from '@/components/shared/SearchOverlay';
import Toast from '@/components/shared/Toast';
import { useFundEstimate } from '@/hooks/useFundEstimate';

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const hideChrome = location.pathname.startsWith('/fund/') || location.pathname.startsWith('/import');

  // Lift useFundEstimate to app shell level — shared by portfolio + watchlist
  useFundEstimate();

  // Listen for 'open-search' custom event from child components (e.g. Dashboard "添加持仓" button)
  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <main className={`max-w-lg mx-auto ${hideChrome ? '' : 'pb-20'}`}>
        {/* Top search bar (only on tab pages) */}
        {!hideChrome && (
          <>
            <div
              className="bg-white px-4 pt-3 pb-2"
              onClick={() => setShowSearch(true)}
            >
              <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 cursor-pointer">
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-gray-400">搜索基金代码、名称或拼音</span>
              </div>
            </div>
            <MarketIndexBar />
          </>
        )}
        {children}
      </main>

      {!hideChrome && <TabBar />}
      <Toast />
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite TabBar**

Replace `client/src/components/layout/TabBar.tsx` with:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  {
    path: '/portfolio',
    label: '持有',
    icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  },
  {
    path: '/watchlist',
    label: '自选',
    icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center pt-2 pb-1.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d={tab.icon} />
              </svg>
              <span className={`text-[10px] ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Update App.tsx routes**

Replace `client/src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import PortfolioPage from './pages/Portfolio';
import WatchlistPage from './pages/Watchlist';
import FundDetailPage from './pages/FundDetail';
import ImportPage from './pages/Import';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/fund/:code" element={<FundDetailPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: Delete dead files**

```bash
rm client/src/components/layout/Header.tsx
rm client/src/pages/Search.tsx
```

- [ ] **Step 5: Update useFundEstimate to merge watchlist codes**

In `client/src/hooks/useFundEstimate.ts`, change the `fetchEstimates` function to also include watchlist codes:

```ts
import { useEffect, useRef, useCallback } from 'react';
import { batchFundEstimate } from '@/api';
import { usePortfolioStore } from '@/stores/portfolio';
import { useWatchlistStore } from '@/stores/watchlist';
import { useFundCacheStore } from '@/stores/fund-cache';
import { getPollingInterval, isTradingTime } from '@/lib/utils';

export function useFundEstimate() {
  const positions = usePortfolioStore((s) => s.positions);
  const watchItems = useWatchlistStore((s) => s.items);
  const patchFundInfo = usePortfolioStore((s) => s.patchFundInfo);
  const setEstimates = useFundCacheStore((s) => s.setEstimates);
  const estimates = useFundCacheStore((s) => s.estimates);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEstimates = useCallback(async () => {
    const positionCodes = positions.map((p) => p.fundCode);
    const watchCodes = watchItems.map((w) => w.fundCode);
    const codes = [...new Set([...positionCodes, ...watchCodes])];
    if (codes.length === 0) return;

    try {
      const data = await batchFundEstimate(codes);
      setEstimates(data);

      for (const est of data) {
        if (est.name) {
          patchFundInfo(est.code, est.name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch estimates:', err);
    }
  }, [positions, watchItems, setEstimates, patchFundInfo]);

  useEffect(() => {
    fetchEstimates();

    const setupPolling = () => {
      if (timerRef.current) clearInterval(timerRef.current);

      const hasConfirmedNav = !isTradingTime()
        ? Object.values(estimates).some((e) => e?.navSource === 'confirmed')
        : undefined;

      const interval = getPollingInterval(hasConfirmedNav);
      timerRef.current = setInterval(() => {
        fetchEstimates();
        const newHasConfirmed = !isTradingTime()
          ? Object.values(estimates).some((e) => e?.navSource === 'confirmed')
          : undefined;
        const newInterval = getPollingInterval(newHasConfirmed);
        if (newInterval !== interval) {
          setupPolling();
        }
      }, interval);
    };

    setupPolling();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchEstimates]);

  return { estimates, refresh: fetchEstimates };
}
```

- [ ] **Step 6: Verify compile + build**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager/client && npx vite build`
Expected: Build succeeds

---

## Task 8: Update Dashboard — group animation, pull-to-refresh, bottom buttons, ProfitSummary

**Depends on:** Task 1, 2, 5, 7

**Files:**
- Modify: `client/src/components/portfolio/Dashboard.tsx`
- Modify: `client/src/components/portfolio/ProfitSummary.tsx`

- [ ] **Step 1: Update ProfitSummary to show group name**

In `client/src/components/portfolio/ProfitSummary.tsx`, change the Props interface and the title display:

```tsx
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
    <div className="bg-white px-4 pt-5 pb-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
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
          <p className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">
            {formatCurrency(totalMarketValue)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
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
          <p className="text-[11px] text-gray-400 mb-1">当日涨跌</p>
          <p className={`text-xl font-bold leading-none ${getPriceColor(todayChange)}`}>
            {todayChange >= 0 ? '+' : ''}¥{formatCurrency(todayChange)}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update Dashboard with group animation, pull-to-refresh, bottom buttons**

Replace `client/src/components/portfolio/Dashboard.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import { useFundCacheStore } from '@/stores/fund-cache';
import { isTradingTime, getCurrentNav, getCurrentChangeRate } from '@/lib/utils';
import type { PositionPnL } from '@/types';
import ProfitSummary from './ProfitSummary';
import PositionCard from './PositionCard';
import GroupTabs from './GroupTabs';
import PullToRefresh from '@/components/shared/PullToRefresh';
import EmptyState from '@/components/shared/EmptyState';
import { batchFundEstimate } from '@/api';

type SortKey = 'todayChange' | 'profit' | 'marketValue';

function TradingStatus({ hasConfirmedNav }: { hasConfirmedNav: boolean }) {
  const trading = isTradingTime();

  let dotClass: string;
  let label: string;

  if (trading) {
    dotClass = 'bg-green-500 animate-pulse';
    label = '交易中 · 估值实时刷新';
  } else if (hasConfirmedNav) {
    dotClass = 'bg-amber-500';
    label = '已收盘 · 已更新今日净值';
  } else {
    dotClass = 'bg-gray-300';
    label = '已收盘 · 等待净值公布';
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-1.5 bg-white border-b border-gray-50">
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const positions = usePortfolioStore((s) => s.positions);
  const activeGroupId = usePortfolioStore((s) => s.activeGroupId);
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

  if (positions.length === 0) {
    return (
      <EmptyState
        icon="📈"
        title="还没有持仓"
        description="点击顶部搜索栏添加你的第一只基金吧"
      />
    );
  }

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span className={`inline-flex flex-col ml-0.5 leading-none`}>
      <span className={`text-[8px] leading-none ${active && !asc ? 'text-blue-500' : 'text-gray-300'}`}>▲</span>
      <span className={`text-[8px] leading-none ${active && asc ? 'text-blue-500' : 'text-gray-300'}`}>▼</span>
    </span>
  );

  // Determine import target group
  const importGroupId = activeGroupId === 'all' ? 'default' : activeGroupId;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-2">
        <ProfitSummary pnlList={pnlList} groupLabel={groupLabel} />
        <GroupTabs />
        <TradingStatus hasConfirmedNav={pnlList.some((p) => p.estimate?.navSource === 'confirmed')} />

        {/* Column Header */}
        <div className="flex items-center px-4 bg-white border-b border-gray-50 min-h-[36px]">
          <div className="w-[140px] flex-shrink-0 pr-3">
            <span className="text-[11px] text-gray-400">基金名称</span>
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center min-w-max">
              <button
                className="w-[100px] flex-shrink-0 text-center flex items-center justify-center"
                onClick={() => handleSort('todayChange')}
              >
                <span className="text-[11px] text-gray-400">当日涨跌</span>
                <SortIcon active={sortKey === 'todayChange'} asc={sortAsc} />
              </button>
              <button
                className="w-[100px] flex-shrink-0 text-center flex items-center justify-center"
                onClick={() => handleSort('profit')}
              >
                <span className="text-[11px] text-gray-400">持有收益</span>
                <SortIcon active={sortKey === 'profit'} asc={sortAsc} />
              </button>
              <div className="w-[80px] flex-shrink-0 text-center">
                <span className="text-[11px] text-gray-400">最新净值</span>
              </div>
              <div className="w-[90px] flex-shrink-0 text-center">
                <span className="text-[11px] text-gray-400">持有份额</span>
              </div>
              <div className="w-[80px] flex-shrink-0 text-center">
                <span className="text-[11px] text-gray-400">成本净值</span>
              </div>
            </div>
          </div>
        </div>

        {/* Position List — animate on group switch */}
        {filteredPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white">
            <span className="text-2xl mb-2">📭</span>
            <p className="text-[13px] text-gray-400">该分组暂无持仓</p>
          </div>
        ) : (
          <div key={activeGroupId} className="divide-y divide-gray-50 animate-fade-in-up">
            {pnlList.map((pnl) => (
              <PositionCard key={`${pnl.position.fundCode}-${pnl.position.groupId}`} pnl={pnl} />
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-white mt-px">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // Open search overlay via a custom event (AppShell listens)
                window.dispatchEvent(new CustomEvent('open-search'));
              }}
              className="text-[13px] text-blue-500"
            >
              + 添加持仓
            </button>
            <button
              onClick={() => navigate(`/import?group=${importGroupId}`)}
              className="text-[13px] text-blue-500"
            >
              📷 截图导入
            </button>
          </div>
          <span className="text-[10px] text-gray-300">← 左滑可删除</span>
        </div>
      </div>
    </PullToRefresh>
  );
}
```

- [ ] **Step 3: Verify compile + build**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager/client && npx vite build`

---

## Task 9: Update FundDetail — watchlist button + group selector

**Depends on:** Task 1, 4

**Files:**
- Modify: `client/src/pages/FundDetail.tsx`

- [ ] **Step 1: Replace FundDetail.tsx entirely**

Replace `client/src/pages/FundDetail.tsx` with:

```tsx
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
                removeWatch(code);
                showToast('已移除自选');
              } else {
                addWatch(code, estimate?.name || position?.fundName || '', position?.fundType);
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
```

- [ ] **Step 2: Verify compile**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager && npx tsc --noEmit --project client/tsconfig.json`

---

## Task 10: Update Import page — group context

**Depends on:** Task 1, 7

**Files:**
- Modify: `client/src/pages/Import.tsx`

- [ ] **Step 1: Add group context to Import page**

In `client/src/pages/Import.tsx`, make these changes:

1. Add imports at top:
```ts
import { useSearchParams } from 'react-router-dom';
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio';
import { useToastStore } from '@/stores/toast';
```

2. At top of component, add:
```ts
const [searchParams] = useSearchParams();
const urlGroupId = searchParams.get('group') || DEFAULT_GROUP_ID;
const groups = usePortfolioStore((s) => s.groups);
const showToast = useToastStore((s) => s.show);
const targetGroup = groups.find((g) => g.id === urlGroupId);
```

3. After the header `<div>` (after line with `</p></div>`), add group indicator:
```tsx
{targetGroup && (
  <div className="mx-4 mt-2 px-3 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
    <span className="text-sm">{targetGroup.icon}</span>
    <span className="text-[13px] text-blue-600">导入到：{targetGroup.name}</span>
  </div>
)}
```

4. In `handleImport`, update BOTH `addPosition` calls to pass `urlGroupId`:

First call (line ~106, inside the `if (!shares || !costNav) continue` branch):
```ts
// Change from:
addPosition(fund.fundCode, fund.fundName, shares, costNav);
// Change to:
addPosition(fund.fundCode, fund.fundName, shares, costNav, undefined, urlGroupId);
```

Second call (line ~109, in the `else` branch):
```ts
// Change from:
addPosition(fund.fundCode, fund.fundName, fund.shares, fund.costNav);
// Change to:
addPosition(fund.fundCode, fund.fundName, fund.shares, fund.costNav, undefined, urlGroupId);
```

5. After the `if (importedCount > 0)` block, before `navigate('/portfolio')`, add toast:
```ts
showToast(`成功导入 ${importedCount} 只基金`);
```

- [ ] **Step 2: Verify compile + build**

Run: `cd /Users/freya/Desktop/QQ-news/fund-manager/client && npx vite build`
Expected: Build succeeds

---

## Task 11: Final integration test

- [ ] **Step 1: Full build check**

```bash
cd /Users/freya/Desktop/QQ-news/fund-manager && npx tsc --noEmit --project client/tsconfig.json
cd /Users/freya/Desktop/QQ-news/fund-manager/client && npx vite build
```

- [ ] **Step 2: Manual verification checklist**

Start dev server: `cd /Users/freya/Desktop/QQ-news/fund-manager && npm run dev`

Verify:
1. ✅ Top search bar visible on both tabs
2. ✅ Market index bar shows 3 indices below search bar
3. ✅ Bottom TabBar has 2 tabs: 持有 / 自选
4. ✅ Click search bar → full-screen overlay opens
5. ✅ Search fund → click → goes to fund detail
6. ✅ Fund detail bottom bar has: 加自选 / 加持仓 / 返回
7. ✅ Add to watchlist → toast "已加入自选"
8. ✅ Switch to 自选 tab → see watchlist
9. ✅ Left-swipe watchlist item → remove
10. ✅ Group tabs still work, switching animates
11. ✅ ProfitSummary shows group name when filtered
12. ✅ "截图导入" button → goes to import page with group param
13. ✅ Import page shows target group indicator
14. ✅ Pull down on Dashboard → refreshes data
15. ✅ Toast appears on add/remove/import actions
