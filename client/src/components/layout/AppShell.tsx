import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TabBar from './TabBar';
import MarketIndexBar from '@/components/shared/MarketIndexBar';
import SearchOverlay from '@/components/shared/SearchOverlay';
import Toast from '@/components/shared/Toast';
import PinLock from '@/components/lock/PinLock';
import { useFundEstimate } from '@/hooks/useFundEstimate';
import { useLockStore } from '@/stores/lock';

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const isLocked = useLockStore((s) => s.isLocked);
  const checkShouldLock = useLockStore((s) => s.checkShouldLock);

  const hideChrome = location.pathname.startsWith('/fund/') || location.pathname.startsWith('/import') || location.pathname.startsWith('/groups') || location.pathname.startsWith('/settings');

  // Lift useFundEstimate to app shell level — shared by portfolio + watchlist
  useFundEstimate();

  // Check PIN lock on mount and when page becomes visible again
  useEffect(() => {
    checkShouldLock();
    const handler = () => {
      if (document.visibilityState === 'visible') {
        checkShouldLock();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [checkShouldLock]);

  // Listen for 'open-search' custom event from child components (e.g. Dashboard "添加持仓" button)
  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <main className={`max-w-lg mx-auto ${hideChrome ? '' : 'pb-20'}`}>
        {/* Top search bar (only on tab pages) */}
        {!hideChrome && (
          <>
            <div
              className="bg-white px-4 pt-3 pb-2"
              onClick={() => setShowSearch(true)}
            >
              <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 cursor-pointer">
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-gray-400">搜索基金代码、名称或拼音</span>
              </div>
            </div>
            <MarketIndexBar />
          </>
        )}
        {children}
      </main>

      {!hideChrome && <TabBar />}
      <Toast />
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {isLocked && <PinLock />}
    </div>
  );
}
