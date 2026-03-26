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
