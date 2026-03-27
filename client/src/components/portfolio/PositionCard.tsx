import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PositionPnL } from '@/types';
import { formatCurrency, formatPercent, getPriceColor } from '@/lib/utils';
import { usePortfolioStore } from '@/stores/portfolio';
import NavSourceBadge from '@/components/shared/NavSourceBadge';

interface Props {
  pnl: PositionPnL;
  scrollRef?: (el: HTMLDivElement | null) => void;
  onScroll?: () => void;
  isLast?: boolean;
}

export default function PositionCard({ pnl, scrollRef, onScroll, isLast }: Props) {
  const navigate = useNavigate();
  const removePosition = usePortfolioStore((s) => s.removePosition);
  const { position, currentNav, marketValue, profit, profitRate, todayChange, todayChangeRate } = pnl;

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
    setOffsetX(Math.max(-DELETE_THRESHOLD, Math.min(0, startOffsetRef.current + dx)));
  };
  const onTouchEnd = () => {
    setSwiping(false);
    setOffsetX(offsetX < -DELETE_THRESHOLD / 2 ? -DELETE_THRESHOLD : 0);
  };
  const handleDelete = () => {
    if (confirm(`确定删除 ${position.fundName}？`)) {
      removePosition(position.fundCode, position.groupId);
    } else {
      setOffsetX(0);
    }
  };

  const typeLabel = position.fundType ? position.fundType.replace(/型.*$/, '').slice(0, 4) : '';

  return (
    <div className="relative overflow-hidden bg-surface">
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-rise">
        <button onClick={handleDelete} className="text-white text-[15px] font-medium w-full h-full">删除</button>
      </div>

      <div
        className={`relative bg-surface flex items-center min-h-[64px] px-6 cursor-pointer active:bg-surface-bg transition-transform`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (offsetX < -10) { setOffsetX(0); return; }
          navigate(`/fund/${position.fundCode}?group=${position.groupId}`);
        }}
      >
        <div className="w-[140px] flex-shrink-0 pr-4 py-3">
          <div className="flex items-center gap-1">
            <p className="text-[15px] text-ink leading-tight truncate">{position.fundName}</p>
            {typeLabel && (
              <span className="flex-shrink-0 text-[9px] text-ink-tertiary border border-ink-faint/50 px-1 py-[0.5px] rounded">
                {typeLabel}
              </span>
            )}
          </div>
          <p className="text-[14px] text-ink-faint mt-1 tabular-nums">¥{formatCurrency(marketValue)}</p>
        </div>

        <div className="flex-1 overflow-x-auto scrollbar-hide" ref={scrollRef} onScroll={onScroll}>
          <div className="flex items-center min-w-max">
            <div className="w-[96px] flex-shrink-0 text-center py-3">
              <p className={`text-[15px] font-medium tabular-nums ${getPriceColor(todayChangeRate)}`}>
                {formatPercent(todayChangeRate)}
              </p>
              <p className={`text-[14px] mt-0.5 tabular-nums ${getPriceColor(todayChange)}`}>
                {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)}
              </p>
            </div>
            <div className="w-[96px] flex-shrink-0 text-center py-3">
              <p className={`text-[15px] font-medium tabular-nums ${getPriceColor(profit)}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </p>
              <p className={`text-[14px] mt-0.5 tabular-nums ${getPriceColor(profitRate)}`}>
                {formatPercent(profitRate)}
              </p>
            </div>
            <div className="w-[80px] flex-shrink-0 text-center py-3">
              <p className="text-[15px] text-ink tabular-nums">{currentNav.toFixed(4)}</p>
              <p className="text-[14px] text-ink-faint mt-0.5 flex items-center justify-center gap-0.5">
                <NavSourceBadge source={pnl.estimate?.navSource} />净值
              </p>
            </div>
            <div className="w-[88px] flex-shrink-0 text-center py-3">
              <p className="text-[15px] text-ink tabular-nums">{position.shares.toFixed(2)}</p>
              <p className="text-[14px] text-ink-faint mt-0.5">份额</p>
            </div>
            <div className="w-[80px] flex-shrink-0 text-center py-3">
              <p className="text-[15px] text-ink tabular-nums">{position.costNav.toFixed(4)}</p>
              <p className="text-[14px] text-ink-faint mt-0.5">成本</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
