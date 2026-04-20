import { create } from 'zustand';
import type { FundEstimate } from '@fund-manager/shared';

interface FundCacheState {
  estimates: Record<string, FundEstimate>;
  weekNavs: Record<string, number>; // fundCode → nav at week start (last Friday close)
  setEstimate: (code: string, estimate: FundEstimate) => void;
  setEstimates: (estimates: FundEstimate[]) => void;
  getEstimate: (code: string) => FundEstimate | undefined;
  setWeekNavs: (navs: Record<string, number>) => void;
}

export const useFundCacheStore = create<FundCacheState>()((set, get) => ({
  estimates: {},
  weekNavs: {},

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

  setWeekNavs: (navs) => {
    set((state) => ({
      weekNavs: { ...state.weekNavs, ...navs },
    }));
  },
}));
