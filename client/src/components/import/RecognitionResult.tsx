import { useState, useCallback } from 'react';
import type { ParsedFund } from '@/types';
import { searchFunds } from '@/api';

interface RecognitionResultProps {
  funds: ParsedFund[];
  onFundsChange: (funds: ParsedFund[]) => void;
  onImport: () => void;
  importing: boolean;
}

export default function RecognitionResult({
  funds,
  onFundsChange,
  onImport,
  importing,
}: RecognitionResultProps) {
  const [validating, setValidating] = useState<Record<number, boolean>>({});

  const updateFund = useCallback(
    (index: number, updates: Partial<ParsedFund>) => {
      const next = [...funds];
      next[index] = { ...next[index], ...updates };
      onFundsChange(next);
    },
    [funds, onFundsChange]
  );

  const removeFund = useCallback(
    (index: number) => {
      onFundsChange(funds.filter((_, i) => i !== index));
    },
    [funds, onFundsChange]
  );

  const validateFundCode = useCallback(
    async (index: number, code: string) => {
      if (code.length !== 6) return;
      setValidating((v) => ({ ...v, [index]: true }));
      try {
        const results = await searchFunds(code);
        const match = results.find((r) => r.code === code);
        if (match) {
          updateFund(index, { fundName: match.name, confirmed: true });
        }
      } catch {
        // ignore search errors
      } finally {
        setValidating((v) => ({ ...v, [index]: false }));
      }
    },
    [updateFund]
  );

  const confirmedCount = funds.filter((f) => f.confirmed).length;
  const hasValidFunds = funds.some((f) => f.fundCode && f.shares && f.shares > 0 && f.costNav && f.costNav > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">
          识别到 {funds.length} 只基金
        </h3>
        <span className="text-xs text-ink-faint">
          已确认 {confirmedCount}/{funds.length}
        </span>
      </div>

      <div className="space-y-3">
        {funds.map((fund, index) => (
          <div
            key={index}
            className={`bg-surface rounded-xl border p-4 space-y-3 transition-colors ${
              fund.confirmed ? 'border-fall/30 bg-fall/5' : 'border-border'
            }`}
          >
            {/* Row 1: Code + Name + Delete */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={fund.fundCode}
                    onChange={(e) => {
                      const code = e.target.value.replace(/\D/g, '').slice(0, 6);
                      updateFund(index, { fundCode: code, confirmed: false });
                    }}
                    onBlur={(e) => validateFundCode(index, e.target.value)}
                    placeholder="基金代码"
                    className="w-20 text-sm font-mono border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent"
                  />
                  {validating[index] ? (
                    <span className="text-xs text-ink-faint">验证中...</span>
                  ) : (
                    <span className="flex-1 text-sm text-ink-secondary truncate">
                      {fund.fundName || '—'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFund(index)}
                className="text-ink-faint hover:text-rise transition-colors p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* Row 2: Shares + Cost NAV */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-ink-faint mb-1 block">持有份额</label>
                <input
                  type="number"
                  value={fund.shares ?? ''}
                  onChange={(e) =>
                    updateFund(index, {
                      shares: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full text-sm border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ink-faint mb-1 block">成本净值</label>
                <input
                  type="number"
                  value={fund.costNav ?? ''}
                  onChange={(e) =>
                    updateFund(index, {
                      costNav: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.0000"
                  step="0.0001"
                  min="0"
                  className="w-full text-sm border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ink-faint mb-1 block">持有金额</label>
                <input
                  type="number"
                  value={fund.marketValue ?? ''}
                  onChange={(e) =>
                    updateFund(index, {
                      marketValue: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full text-sm border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Confirm button */}
            {!fund.confirmed && (
              <button
                onClick={() => {
                  updateFund(index, { confirmed: true });
                  if (fund.fundCode.length === 6) {
                    validateFundCode(index, fund.fundCode);
                  }
                }}
                className="text-xs text-accent hover:text-accent"
              >
                确认此条
              </button>
            )}
            {fund.confirmed && (
              <span className="text-xs text-fall flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                已确认
              </span>
            )}
          </div>
        ))}
      </div>

      {funds.length === 0 && (
        <div className="text-center py-8 text-ink-faint text-sm">
          未识别到基金信息，请检查截图是否包含持仓数据
        </div>
      )}

      {/* Import button */}
      {funds.length > 0 && (
        <button
          onClick={onImport}
          disabled={importing || !hasValidFunds}
          className={`w-full py-3 rounded-xl text-white font-medium transition-colors ${
            importing || !hasValidFunds
              ? 'bg-border cursor-not-allowed'
              : 'bg-accent hover:bg-accent/90 active:bg-accent/80'
          }`}
        >
          {importing ? '导入中...' : `全部导入 (${funds.length} 只基金)`}
        </button>
      )}

      <p className="text-xs text-ink-faint text-center">
        导入前请确认基金代码、份额和成本净值正确
      </p>
    </div>
  );
}
