import { useState, useEffect, useCallback } from 'react';
import { getFundHistory } from '@/api';
import type { NavRecord } from '@/types';

export type Period = '1m' | '3m' | '6m' | '1y' | 'all';

const PERIOD_SIZE: Record<Period, number> = {
  '1m': 22,
  '3m': 66,
  '6m': 132,
  '1y': 252,
  all: 500,
};

export function useFundHistory(code: string, period: Period = '3m') {
  const [records, setRecords] = useState<NavRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const size = PERIOD_SIZE[period];
      const data = await getFundHistory(code, 1, size);
      // Reverse so oldest is first (for chart)
      setRecords(data.records.reverse());
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [code, period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { records, loading, error, refresh: fetchHistory };
}
