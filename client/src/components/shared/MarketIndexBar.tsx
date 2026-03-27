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
      <div className="flex items-center justify-around px-4 py-2 bg-white">
        {['上证', '深证', '创业板'].map((name) => (
          <div key={name} className="text-center">
            <span className="text-[14px] text-ios-gray">{name}</span>
            <span className="text-[14px] text-ios-gray/50 ml-1">--</span>
          </div>
        ))}
      </div>
    );
  }

  if (indices.length === 0) return null;

  return (
    <div className="flex items-center justify-around px-4 py-2 bg-white">
      {indices.map((idx) => (
        <div key={idx.code} className="text-center flex items-center gap-1">
          <span className="text-[14px] text-ios-gray">{INDEX_NAMES[idx.code] || idx.name}</span>
          <span className={`text-[14px] font-medium ${getPriceColor(idx.changeRate)}`}>
            {idx.price.toFixed(0)}
          </span>
          <span className={`text-[14px] ${getPriceColor(idx.changeRate)}`}>
            {idx.changeRate > 0 ? '+' : ''}{idx.changeRate.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
