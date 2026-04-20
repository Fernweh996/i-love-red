import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlistStore } from '@/stores/watchlist';
import { useFundCacheStore } from '@/stores/fund-cache';
import { formatPercent, getPriceColor, getCurrentNav, getCurrentChangeRate } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';
import PullToRefresh from '@/components/shared/PullToRefresh';
import GroupTabs from '@/components/portfolio/GroupTabs';
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
    <div className="relative overflow-hidden bg-surface">
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-rise">
        <button onClick={onRemove} className="text-white text-xs font-medium w-full h-full">移除</button>
      </div>
      <div
        className="relative bg-surface flex items-center min-h-[56px] px-4 active:bg-surface-bg transition-transform"
        style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease-out' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (offsetX < -10) { setOffsetX(0); return; } onClick(); }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-medium text-ink truncate">{fundName}</p>
            {typeLabel && (
              <span className="flex-shrink-0 text-[9px] text-ink-secondary border border-border px-1 py-[1px] rounded">{typeLabel}</span>
            )}
          </div>
          <p className="text-[11px] text-ink-faint mt-0.5">{fundCode}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-[15px] font-bold ${getPriceColor(changeRate)}`}>
            {formatPercent(changeRate)}
          </span>
          <span className="text-[13px] text-ink-secondary w-[60px] text-right">
            {currentNav > 0 ? currentNav.toFixed(4) : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const items = useWatchlistStore((s) => s.items);
  const activeGroupId = useWatchlistStore((s) => s.activeGroupId);
  const setActiveGroupId = useWatchlistStore((s) => s.setActiveGroupId);
  const removeItem = useWatchlistStore((s) => s.removeItem);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();

  // Filter by group
  const filteredItems = useMemo(() => {
    if (activeGroupId === 'all') return items;
    return items.filter((i) => i.groupId === activeGroupId);
  }, [items, activeGroupId]);

  const getCount = (groupId: string) =>
    items.filter((i) => i.groupId === groupId).length;

  const handleRefresh = async () => {
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-2">
        {/* Group tabs — shared with portfolio */}
        <GroupTabs
          activeGroupId={activeGroupId}
          onGroupChange={setActiveGroupId}
          getCount={getCount}
          totalCount={items.length}
        />

        {filteredItems.length === 0 ? (
          <EmptyState
            icon="⭐"
            title={activeGroupId === 'all' ? '还没有自选基金' : '该分组暂无自选'}
            description="点击顶部搜索栏添加你关注的基金吧"
          />
        ) : (
          <>
            {/* Column header */}
            <div className="flex items-center px-4 bg-surface border-b border-surface-bg min-h-[32px]">
              <span className="flex-1 text-[11px] text-ink-faint">基金名称</span>
              <span className="text-[11px] text-ink-faint w-[80px] text-center">涨跌幅</span>
              <span className="text-[11px] text-ink-faint w-[60px] text-right">净值</span>
            </div>

            <div key={activeGroupId} className="divide-y divide-surface-bg animate-fade-in-up">
              {filteredItems.map((item) => (
                <WatchCard
                  key={`${item.fundCode}-${item.groupId}`}
                  fundCode={item.fundCode}
                  fundName={item.fundName}
                  fundType={item.fundType}
                  onRemove={() => {
                    removeItem(item.fundCode, item.groupId);
                    showToast('已移除自选');
                  }}
                  onClick={() => navigate(`/fund/${item.fundCode}`)}
                />
              ))}
            </div>

            <div className="px-4 py-3 bg-surface mt-px">
              <span className="text-[10px] text-ink-faint">← 左滑可移除</span>
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}
