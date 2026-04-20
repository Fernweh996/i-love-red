import { useState, useEffect } from 'react';
import { getFundHoldings } from '@/api';
import type { HoldingStock } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Props {
  code: string;
}

export default function HoldingsTable({ code }: Props) {
  const [holdings, setHoldings] = useState<HoldingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFundHoldings(code)
      .then(setHoldings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <LoadingSpinner text="加载持仓..." />;

  if (holdings.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs text-ink-faint">暂无重仓股数据</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Table header */}
      <div className="flex items-center px-4 py-2 text-[11px] text-ink-faint">
        <span className="w-6">#</span>
        <span className="flex-1">股票名称</span>
        <span className="w-16 text-right">占比</span>
      </div>

      <div className="divide-y divide-border-light">
        {holdings.slice(0, 10).map((stock, i) => (
          <div key={stock.code} className="flex items-center px-4 py-2.5">
            <span className="w-6 text-xs text-ink-faint font-medium">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-ink truncate">{stock.name}</p>
              <p className="text-[11px] text-ink-faint">{stock.code}</p>
            </div>
            <span className="w-16 text-right text-[13px] text-ink-secondary font-medium">
              {stock.proportion > 0 ? `${stock.proportion.toFixed(2)}%` : '--'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
