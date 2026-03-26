import { useState, useCallback, useEffect } from 'react';

interface Props {
  onComplete: (pin: string) => void;
  onSkip?: () => void;
}

type Step = 'enter' | 'confirm';

export default function PinSetup({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = useCallback(
    (d: string) => {
      if (error) return;
      const next = [...digits, d];
      setDigits(next);
      if (next.length === 4) {
        const pin = next.join('');
        if (step === 'enter') {
          setFirstPin(pin);
          setDigits([]);
          setStep('confirm');
        } else {
          // confirm step
          if (pin === firstPin) {
            onComplete(pin);
          } else {
            setError(true);
            setErrorMsg('两次输入不一致，请重新设置');
            setTimeout(() => {
              setError(false);
              setErrorMsg('');
              setDigits([]);
              setFirstPin('');
              setStep('enter');
            }, 800);
          }
        }
      }
    },
    [digits, error, step, firstPin, onComplete]
  );

  const handleDelete = useCallback(() => {
    if (error) return;
    setDigits((prev) => prev.slice(0, -1));
  }, [error]);

  // Keyboard input
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
    <div className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center select-none">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">🔑</div>
        <p className="text-[15px] text-gray-700 font-medium">
          {step === 'enter' ? '设置 4 位 PIN 码' : '再次输入以确认'}
        </p>
        {errorMsg && (
          <p className="text-[12px] text-red-500 mt-1">{errorMsg}</p>
        )}
      </div>

      {/* Dots */}
      <div className={`flex gap-4 mb-12 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
              error
                ? 'bg-red-500 border-red-500'
                : digits.length > i
                ? 'bg-gray-800 border-gray-800'
                : 'bg-transparent border-gray-300'
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
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-gray-500 active:bg-gray-100 transition-colors mx-auto"
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
              className="w-[72px] h-[72px] rounded-full bg-gray-50 flex items-center justify-center text-[22px] font-medium text-gray-800 active:bg-gray-200 transition-colors mx-auto"
            >
              {key}
            </button>
          );
        })}
      </div>

      {onSkip && (
        <button
          onClick={onSkip}
          className="mt-8 text-[13px] text-gray-400 active:text-gray-600"
        >
          跳过设置
        </button>
      )}
    </div>
  );
}
