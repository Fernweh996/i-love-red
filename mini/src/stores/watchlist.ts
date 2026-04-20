import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WatchItem } from '@fund-manager/shared';
import { DEFAULT_GROUP_ID } from './portfolio';
import { taroStorage } from '../lib/taro-storage';

interface WatchlistState {
  items: WatchItem[];
  activeGroupId: string; // 'all' = 汇总
  setActiveGroupId: (id: string) => void;
  addItem: (fundCode: string, fundName: string, fundType?: string, groupId?: string) => void;
  removeItem: (fundCode: string, groupId?: string) => void;
  isWatching: (fundCode: string) => boolean;
  clearGroup: (groupId: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      activeGroupId: 'all',

      setActiveGroupId: (id) => {
        set({ activeGroupId: id });
      },

      addItem: (fundCode, fundName, fundType, groupId = DEFAULT_GROUP_ID) => {
        // Same fund can exist in different groups
        if (get().items.some((i) => i.fundCode === fundCode && i.groupId === groupId)) return;
        set((state) => ({
          items: [...state.items, { fundCode, fundName, fundType, addTime: Date.now(), groupId }],
        }));
      },

      removeItem: (fundCode, groupId) => {
        set((state) => ({
          items: groupId
            ? state.items.filter((i) => !(i.fundCode === fundCode && i.groupId === groupId))
            : state.items.filter((i) => i.fundCode !== fundCode),
        }));
      },

      isWatching: (fundCode) => {
        return get().items.some((i) => i.fundCode === fundCode);
      },

      clearGroup: (groupId) => {
        set((state) => ({
          items: state.items.filter((i) => i.groupId !== groupId),
        }));
      },
    }),
    {
      name: 'fund-manager-watchlist',
      version: 1,
      storage: createJSONStorage(() => taroStorage),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0) {
          const items = (state.items as WatchItem[]) || [];
          return {
            ...state,
            items: items.map((i) => ({ ...i, groupId: i.groupId || DEFAULT_GROUP_ID })),
            activeGroupId: 'all',
          };
        }
        return state;
      },
    }
  )
);
