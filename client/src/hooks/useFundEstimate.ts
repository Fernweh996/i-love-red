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
