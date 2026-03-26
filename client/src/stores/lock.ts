import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LockMode = 'always' | 'daily' | 'never';

interface LockState {
  pinHash: string | null;
  lockMode: LockMode;
  lastUnlockDate: string | null;
  isLocked: boolean;

  setPin: (pin: string) => Promise<void>;
  removePin: () => void;
  setLockMode: (mode: LockMode) => void;
  unlock: (pin: string) => Promise<boolean>;
  checkShouldLock: () => void;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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

      setPin: async (pin: string) => {
        const hash = await hashPin(pin);
        set({ pinHash: hash });
      },

      removePin: () => {
        set({ pinHash: null, isLocked: false, lastUnlockDate: null });
      },

      setLockMode: (mode: LockMode) => {
        set({ lockMode: mode });
      },

      unlock: async (pin: string) => {
        const hash = await hashPin(pin);
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
      partialize: (state) => ({
        pinHash: state.pinHash,
        lockMode: state.lockMode,
        lastUnlockDate: state.lastUnlockDate,
        // isLocked is NOT persisted — computed on load
      }),
    }
  )
);
