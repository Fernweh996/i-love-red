import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Position, Group } from '@fund-manager/shared';
import { calcWeightedCost } from '@fund-manager/shared';
import { taroStorage } from '../lib/taro-storage';
import { generateUUID } from '../lib/uuid';

export const DEFAULT_GROUP_ID = 'licaitong';

export const PRESET_GROUPS: Group[] = [
  { id: 'licaitong', name: '腾讯理财通', icon: '💰', order: 0, isPreset: true },
  { id: 'alipay', name: '支付宝基金', icon: '🔵', order: 1, isPreset: true },
];

interface PortfolioState {
  positions: Position[];
  groups: Group[];
  activeGroupId: string; // 'all' = 全部

  // Group methods
  setActiveGroupId: (id: string) => void;
  addGroup: (name: string, icon: string) => void;
  updateGroup: (id: string, name: string, icon: string) => void;
  removeGroup: (id: string) => void;
  clearGroup: (id: string) => void;
  reorderGroups: (ids: string[]) => void;

  // Position methods
  addPosition: (fundCode: string, fundName: string, shares: number, costNav: number, fundType?: string, groupId?: string) => void;
  removePosition: (fundCode: string, groupId: string) => void;
  updatePosition: (fundCode: string, groupId: string, shares: number, costNav: number) => void;
  addToPosition: (fundCode: string, groupId: string, shares: number, costNav: number) => void;
  reducePosition: (fundCode: string, groupId: string, reduceShares: number) => void;
  convertPosition: (fundCode: string, groupId: string, toFundCode: string, toFundName: string, shares: number, toNav: number, toFundType?: string) => void;
  patchFundInfo: (fundCode: string, name: string, fundType?: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      positions: [],
      groups: [...PRESET_GROUPS],
      activeGroupId: 'all',

      // ---- Group methods ----

      setActiveGroupId: (id) => {
        set({ activeGroupId: id });
      },

      addGroup: (name, icon) => {
        const groups = get().groups;
        const maxOrder = groups.reduce((max, g) => Math.max(max, g.order), 0);
        const newGroup: Group = {
          id: generateUUID(),
          name,
          icon,
          order: maxOrder + 1,
          isPreset: false,
        };
        set({ groups: [...groups, newGroup] });
      },

      updateGroup: (id, name, icon) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, name, icon } : g
          ),
        }));
      },

      removeGroup: (id) => {
        const group = get().groups.find((g) => g.id === id);
        if (!group || group.isPreset) return;

        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          // Move positions from deleted group to default
          positions: state.positions.map((p) =>
            p.groupId === id ? { ...p, groupId: DEFAULT_GROUP_ID, updateTime: Date.now() } : p
          ),
          activeGroupId: state.activeGroupId === id ? 'all' : state.activeGroupId,
        }));
      },

      clearGroup: (id) => {
        set((state) => ({
          positions: state.positions.filter((p) => p.groupId !== id),
        }));
      },

      reorderGroups: (ids) => {
        set((state) => ({
          groups: state.groups.map((g) => {
            const newOrder = ids.indexOf(g.id);
            return newOrder >= 0 ? { ...g, order: newOrder } : g;
          }),
        }));
      },

      // ---- Position methods ----

      addPosition: (fundCode, fundName, shares, costNav, fundType, groupId = DEFAULT_GROUP_ID) => {
        const existing = get().positions.find(
          (p) => p.fundCode === fundCode && p.groupId === groupId
        );
        if (existing) {
          get().addToPosition(fundCode, groupId, shares, costNav);
          return;
        }

        const now = Date.now();
        set((state) => ({
          positions: [
            ...state.positions,
            {
              fundCode,
              fundName,
              fundType,
              shares,
              costNav,
              totalCost: shares * costNav,
              createTime: now,
              updateTime: now,
              groupId,
            },
          ],
        }));
      },

      removePosition: (fundCode, groupId) => {
        set((state) => ({
          positions: state.positions.filter(
            (p) => !(p.fundCode === fundCode && p.groupId === groupId)
          ),
        }));
      },

      updatePosition: (fundCode, groupId, shares, costNav) => {
        set((state) => ({
          positions: state.positions.map((p) =>
            p.fundCode === fundCode && p.groupId === groupId
              ? { ...p, shares, costNav, totalCost: shares * costNav, updateTime: Date.now() }
              : p
          ),
        }));
      },

      addToPosition: (fundCode, groupId, newShares, newCostNav) => {
        set((state) => ({
          positions: state.positions.map((p) => {
            if (p.fundCode !== fundCode || p.groupId !== groupId) return p;
            const result = calcWeightedCost(p.shares, p.costNav, newShares, newCostNav);
            return {
              ...p,
              shares: result.shares,
              costNav: result.costNav,
              totalCost: result.totalCost,
              updateTime: Date.now(),
            };
          }),
        }));
      },

      reducePosition: (fundCode, groupId, reduceShares) => {
        const pos = get().positions.find(
          (p) => p.fundCode === fundCode && p.groupId === groupId
        );
        if (!pos) return;
        const remaining = pos.shares - reduceShares;
        if (remaining <= 0) {
          // Remove entirely
          get().removePosition(fundCode, groupId);
          return;
        }
        // Reduce shares, totalCost proportionally
        const ratio = remaining / pos.shares;
        set((state) => ({
          positions: state.positions.map((p) =>
            p.fundCode === fundCode && p.groupId === groupId
              ? {
                  ...p,
                  shares: remaining,
                  totalCost: p.totalCost * ratio,
                  updateTime: Date.now(),
                }
              : p
          ),
        }));
      },

      convertPosition: (fundCode, groupId, toFundCode, toFundName, shares, toNav, toFundType) => {
        // Fund-to-fund conversion: reduce source fund shares, add to target fund
        const source = get().positions.find(
          (p) => p.fundCode === fundCode && p.groupId === groupId
        );
        if (!source || shares <= 0 || shares > source.shares) return;

        // 1. Reduce source fund
        get().reducePosition(fundCode, groupId, shares);

        // 2. Calculate conversion: transferred value = shares * source costNav
        const transferValue = shares * source.costNav;
        const toShares = transferValue / toNav;

        // 3. Add to target fund (addPosition handles merge if already exists)
        get().addPosition(toFundCode, toFundName, toShares, toNav, toFundType, groupId);
      },

      patchFundInfo: (fundCode, name, fundType) => {
        set((state) => ({
          positions: state.positions.map((p) => {
            if (p.fundCode !== fundCode) return p;
            const updates: Partial<Position> = {};
            if (name && !p.fundName) updates.fundName = name;
            if (fundType && !p.fundType) updates.fundType = fundType;
            return Object.keys(updates).length > 0 ? { ...p, ...updates } : p;
          }),
        }));
      },
    }),
    {
      name: 'fund-manager-portfolio',
      version: 2,
      storage: createJSONStorage(() => taroStorage),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0) {
          // Migration from v0: add groupId to all positions, initialize groups
          const positions = (state.positions as Position[]) || [];
          return {
            ...state,
            positions: positions.map((p) => ({
              ...p,
              groupId: p.groupId || 'licaitong',
            })),
            groups: [...PRESET_GROUPS],
            activeGroupId: 'all',
          };
        }
        if (version === 1) {
          // Migration from v1: remove "default" group, move its positions to first preset
          const positions = (state.positions as Position[]) || [];
          const groups = (state.groups as Group[]) || [];
          return {
            ...state,
            positions: positions.map((p) =>
              p.groupId === 'default' ? { ...p, groupId: 'licaitong' } : p
            ),
            groups: groups.filter((g) => g.id !== 'default'),
            activeGroupId: state.activeGroupId === 'default' ? 'all' : state.activeGroupId,
          };
        }
        return state;
      },
    }
  )
);
