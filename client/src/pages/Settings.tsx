import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLockStore } from '@/stores/lock';
import { usePortfolioStore } from '@/stores/portfolio';
import { useWatchlistStore } from '@/stores/watchlist';
import { useToastStore } from '@/stores/toast';
import PinSetup from '@/components/lock/PinSetup';

type LockMode = 'always' | 'daily' | 'never';

const LOCK_MODE_LABELS: Record<LockMode, string> = {
  always: '每次打开',
  daily: '每日首次',
  never: '从不',
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const pinHash = useLockStore((s) => s.pinHash);
  const lockMode = useLockStore((s) => s.lockMode);
  const setPin = useLockStore((s) => s.setPin);
  const removePin = useLockStore((s) => s.removePin);
  const setLockMode = useLockStore((s) => s.setLockMode);
  const showToast = useToastStore((s) => s.show);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPinSetup, setShowPinSetup] = useState(false);
  const hasPin = !!pinHash;

  const handleSetPin = async (pin: string) => {
    await setPin(pin);
    setShowPinSetup(false);
    showToast('PIN 码已设置');
  };

  const handleRemovePin = () => {
    if (confirm('确定关闭 PIN 码锁？')) {
      removePin();
      showToast('PIN 码已关闭');
    }
  };

  // ---- Export ----
  const handleExport = () => {
    const portfolioState = usePortfolioStore.getState();
    const watchlistState = useWatchlistStore.getState();

    const data = {
      version: 1,
      exportTime: new Date().toISOString(),
      portfolio: {
        positions: portfolioState.positions,
        groups: portfolioState.groups,
      },
      watchlist: {
        items: watchlistState.items,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fund-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据已导出');
  };

  // ---- Import ----
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);

        if (!data.portfolio && !data.watchlist) {
          showToast('无效的备份文件');
          return;
        }

        if (!confirm('导入将覆盖当前所有数据，确定继续？')) return;

        if (data.portfolio) {
          usePortfolioStore.setState({
            groups: data.portfolio.groups || [],
            positions: data.portfolio.positions || [],
          });
        }

        if (data.watchlist) {
          useWatchlistStore.setState({
            items: data.watchlist.items || [],
          });
        }

        showToast('数据已恢复');
      } catch {
        showToast('文件格式错误');
      }
    };
    reader.readAsText(file);

    // Reset so same file can be selected again
    e.target.value = '';
  };

  if (showPinSetup) {
    return (
      <PinSetup
        onComplete={handleSetPin}
        onSkip={() => setShowPinSetup(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 mr-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[16px] font-semibold text-gray-800">应用设置</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Security section */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-[13px] text-gray-400 font-medium mb-3">🔐 安全设置</h2>

          {/* PIN status */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[14px] text-gray-800">PIN 码锁</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {hasPin ? '已设置' : '未设置'}
              </p>
            </div>
            <div className="flex gap-2">
              {hasPin ? (
                <>
                  <button
                    onClick={() => setShowPinSetup(true)}
                    className="text-[12px] text-blue-500 px-2.5 py-1.5 rounded-lg active:bg-blue-50"
                  >
                    修改
                  </button>
                  <button
                    onClick={handleRemovePin}
                    className="text-[12px] text-red-500 px-2.5 py-1.5 rounded-lg active:bg-red-50"
                  >
                    关闭
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPinSetup(true)}
                  className="text-[12px] text-blue-500 px-2.5 py-1.5 rounded-lg active:bg-blue-50"
                >
                  设置 PIN
                </button>
              )}
            </div>
          </div>

          {/* Lock frequency */}
          {hasPin && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[13px] text-gray-600 mb-2">解锁频率</p>
              <div className="flex gap-2">
                {(Object.keys(LOCK_MODE_LABELS) as LockMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLockMode(mode)}
                    className={`flex-1 py-2 rounded-lg text-[12px] transition-colors ${
                      lockMode === mode
                        ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {LOCK_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data management section */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-[13px] text-gray-400 font-medium mb-3">💾 数据管理</h2>

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between py-3 border-b border-gray-50"
          >
            <div className="text-left">
              <p className="text-[14px] text-gray-800">导出数据</p>
              <p className="text-[11px] text-gray-400 mt-0.5">备份持仓、自选和分组数据</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center justify-between py-3"
          >
            <div className="text-left">
              <p className="text-[14px] text-gray-800">导入数据</p>
              <p className="text-[11px] text-gray-400 mt-0.5">从备份文件恢复数据</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
