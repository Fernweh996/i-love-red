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
      <div className="flex items-center justify-between px-6 py-2 bg-surface">
        {['上证', '深证', '创业板'].map((name) => (
          <div key={name} className="text-center">
            <span className="text-[12px] text-ink-faint tracking-label uppercase">{name}</span>
            <span className="text-[15px] text-ink-faint ml-1.5">—</span>
          </div>
        ))}
      </div>
    );
  }

  if (indices.length === 0) return null;

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-surface">
      {indices.map((idx) => (
        <div key={idx.code} className="text-center flex items-center gap-1.5">
          <span className="text-[12px] text-ink-tertiary tracking-label uppercase">
            {INDEX_NAMES[idx.code] || idx.name}
          </span>
          <span className={`text-[15px] font-medium tabular-nums ${getPriceColor(idx.changeRate)}`}>
            {idx.changeRate > 0 ? '+' : ''}{idx.changeRate.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
