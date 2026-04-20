import { useState, useCallback, useEffect } from 'react';
import { useLockStore } from '@/stores/lock';

export default function PinLock() {
  const unlock = useLockStore((s) => s.unlock);
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleDigit = useCallback(
    (d: string) => {
      if (checking || error) return;
      const next = [...digits, d];
      setDigits(next);
      if (next.length === 4) {
        setChecking(true);
        unlock(next.join('')).then((ok) => {
          if (!ok) {
            setError(true);
            setTimeout(() => {
              setError(false);
              setDigits([]);
              setChecking(false);
            }, 500);
          }
          // if ok, store sets isLocked=false and component unmounts
        });
      }
    },
    [digits, checking, error, unlock]
  );

  const handleDelete = useCallback(() => {
    if (checking || error) return;
    setDigits((prev) => prev.slice(0, -1));
  }, [checking, error]);

  // Handle keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDigit, handleDelete]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 z-[70] bg-surface flex flex-col items-center justify-center select-none">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-[15px] text-ink font-medium">输入 PIN 码解锁</p>
        {error && (
          <p className="text-[12px] text-rise mt-1">PIN 码错误，请重试</p>
        )}
      </div>

      {/* Dots */}
      <div className={`flex gap-4 mb-12 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
              error
                ? 'bg-rise border-rise'
                : digits.length > i
                ? 'bg-ink border-ink'
                : 'bg-transparent border-border'
            }`}
          />
        ))}
      </div>

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-4 w-[260px]">
        {keys.map((key, idx) => {
          if (key === '') return <div key={idx} />;
          if (key === 'del') {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-ink-secondary active:bg-surface-bg transition-colors mx-auto"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                </svg>
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleDigit(key)}
              className="w-[72px] h-[72px] rounded-full bg-surface-bg flex items-center justify-center text-[22px] font-medium text-ink active:bg-border transition-colors mx-auto"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
