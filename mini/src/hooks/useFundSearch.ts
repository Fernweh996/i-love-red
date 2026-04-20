import { useState, useEffect, useRef, useCallback } from 'react';
import { searchFunds } from '@/api';
import type { FundInfo } from '@fund-manager/shared';

export function useFundSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<FundInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchFunds(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, clear };
}
