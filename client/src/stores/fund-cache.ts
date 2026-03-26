import { create } from 'zustand';
import type { FundEstimate } from '@/types';

interface FundCacheState {
  estimates: Record<string, FundEstimate>;
  setEstimate: (code: string, estimate: FundEstimate) => void;
  setEstimates: (estimates: FundEstimate[]) => void;
  getEstimate: (code: string) => FundEstimate | undefined;
}

export const useFundCacheStore = create<FundCacheState>()((set, get) => ({
  estimates: {},

  setEstimate: (code, estimate) => {
    set((state) => ({
      estimates: { ...state.estimates, [code]: estimate },
    }));
  },

  setEstimates: (estimates) => {
    set((state) => {
      const updated = { ...state.estimates };
      for (const est of estimates) {
        updated[est.code] = est;
      }
      return { estimates: updated };
    });
  },

  getEstimate: (code) => {
    return get().estimates[code];
  },
}));
