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

  useFundEstimate();

  useEffect(() => {
    checkShouldLock();
    const handler = () => {
      if (document.visibilityState === 'visible') checkShouldLock();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [checkShouldLock]);

  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  return (
    <div className="min-h-screen bg-ios-bg">
      <main className={`max-w-lg mx-auto ${hideChrome ? '' : 'pb-[80px]'}`}>
        {!hideChrome && (
          <>
            <div
              className="bg-white px-4 pt-2 pb-2"
              onClick={() => setShowSearch(true)}
            >
              <div className="flex items-center bg-ios-fill/50 rounded-[10px] px-3 py-2 cursor-pointer">
                <svg className="w-4 h-4 text-ios-gray mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-[15px] text-ios-gray">搜索基金代码、名称或拼音</span>
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
