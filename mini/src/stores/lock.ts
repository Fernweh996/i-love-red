import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { taroStorage } from '../lib/taro-storage';

type LockMode = 'always' | 'daily' | 'never';

interface LockState {
  pinHash: string | null;
  lockMode: LockMode;
  lastUnlockDate: string | null;
  isLocked: boolean;

  setPin: (pin: string) => void;
  removePin: () => void;
  setLockMode: (mode: LockMode) => void;
  unlock: (pin: string) => boolean;
  checkShouldLock: () => void;
}

function hashPin(pin: string): string {
  // Simple hash for local PIN (not cryptographic security)
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      lockMode: 'always',
      lastUnlockDate: null,
      isLocked: false,

      setPin: (pin: string) => {
        const hash = hashPin(pin);
        set({ pinHash: hash });
      },

      removePin: () => {
        set({ pinHash: null, isLocked: false, lastUnlockDate: null });
      },

      setLockMode: (mode: LockMode) => {
        set({ lockMode: mode });
      },

      unlock: (pin: string) => {
        const hash = hashPin(pin);
        if (hash === get().pinHash) {
          set({ isLocked: false, lastUnlockDate: getTodayDate() });
          return true;
        }
        return false;
      },

      checkShouldLock: () => {
        const { pinHash, lockMode, lastUnlockDate } = get();
        if (!pinHash || lockMode === 'never') {
          set({ isLocked: false });
          return;
        }
        if (lockMode === 'daily') {
          const today = getTodayDate();
          if (lastUnlockDate === today) {
            set({ isLocked: false });
            return;
          }
        }
        // 'always' or daily but not unlocked today
        set({ isLocked: true });
      },
    }),
    {
      name: 'fund-manager-lock',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        pinHash: state.pinHash,
        lockMode: state.lockMode,
        lastUnlockDate: state.lastUnlockDate,
        // isLocked is NOT persisted — computed on load
      }),
    }
  )
);
