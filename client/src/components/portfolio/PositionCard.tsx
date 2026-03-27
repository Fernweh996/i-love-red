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
}

export default function PositionCard({ pnl, scrollRef, onScroll }: Props) {
  const navigate = useNavigate();
  const removePosition = usePortfolioStore((s) => s.removePosition);
  const { position, currentNav, marketValue, profit, profitRate, todayChange, todayChangeRate } = pnl;

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

  const handleDelete = () => {
    if (confirm(`确定删除 ${position.fundName} 的持仓？`)) {
      removePosition(position.fundCode, position.groupId);
    } else {
      setOffsetX(0);
    }
  };

  // Short type label
  const typeLabel = position.fundType
    ? position.fundType.replace(/型.*$/, '').slice(0, 4)
    : '';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Delete action (behind the card) */}
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-morandi-pink rounded-r-2xl">
        <button onClick={handleDelete} className="text-white text-xs font-medium w-full h-full">
          删除
        </button>
      </div>

      {/* Card body — slides left on swipe */}
      <div
        className="relative bg-white rounded-2xl flex items-center min-h-[68px] px-4 cursor-pointer active:bg-gray-50/50 transition-transform"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (offsetX < -10) {
            setOffsetX(0);
            return;
          }
          navigate(`/fund/${position.fundCode}?group=${position.groupId}`);
        }}
      >
        {/* Left: fund name + market value */}
        <div className="w-[140px] flex-shrink-0 pr-3 py-3">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-normal text-gray-700 leading-tight truncate">
              {position.fundName}
            </p>
            {typeLabel && (
              <span className="flex-shrink-0 text-[9px] text-morandi-blue bg-morandi-blue/10 px-1.5 py-[1px] rounded-md">
                {typeLabel}
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-300 mt-1">
            ¥{formatCurrency(marketValue)}
          </p>
        </div>

        {/* Right: scrollable columns */}
        <div className="flex-1 overflow-x-auto scrollbar-hide" ref={scrollRef} onScroll={onScroll}>
          <div className="flex items-center min-w-max">
            {/* 当日涨跌（幅度 + 金额） */}
            <div className="w-[100px] flex-shrink-0 text-center py-3">
              <p className={`text-[15px] font-medium ${getPriceColor(todayChangeRate)}`}>
                {formatPercent(todayChangeRate)}
              </p>
              <p className={`text-[12px] mt-0.5 ${getPriceColor(todayChange)}`}>
                {todayChange >= 0 ? '+' : ''}¥{formatCurrency(todayChange)}
              </p>
            </div>

            {/* 持有收益（金额 + 比例） */}
            <div className="w-[100px] flex-shrink-0 text-center py-3">
              <p className={`text-[15px] font-medium ${getPriceColor(profit)}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </p>
              <p className={`text-[12px] mt-0.5 ${getPriceColor(profitRate)}`}>
                {formatPercent(profitRate)}
              </p>
            </div>

            {/* 最新净值 */}
            <div className="w-[80px] flex-shrink-0 text-center py-3">
              <p className="text-[14px] font-normal text-gray-600">
                {currentNav.toFixed(4)}
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5 flex items-center justify-center gap-0.5">
                <NavSourceBadge source={pnl.estimate?.navSource} />
                净值
              </p>
            </div>

            {/* 持有份额 */}
            <div className="w-[90px] flex-shrink-0 text-center py-3">
              <p className="text-[14px] font-normal text-gray-600">
                {position.shares.toFixed(2)}
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5">份额</p>
            </div>

            {/* 成本净值 */}
            <div className="w-[80px] flex-shrink-0 text-center py-3">
              <p className="text-[14px] font-normal text-gray-600">
                {position.costNav.toFixed(4)}
              </p>
              <p className="text-[11px] text-gray-300 mt-0.5">成本</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
