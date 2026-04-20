import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio';
import { useToastStore } from '@/stores/toast';
import { useFundSearch } from '@/hooks/useFundSearch';
import type { FundInfo } from '@/types';

type Tab = 'add' | 'reduce' | 'dip' | 'convert';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'add', label: '加仓', icon: '📈' },
  { key: 'reduce', label: '减仓', icon: '📉' },
  { key: 'dip', label: '定投', icon: '🔄' },
  { key: 'convert', label: '转换', icon: '🔀' },
];

export default function PositionEditPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group') || DEFAULT_GROUP_ID;
  const showToast = useToastStore((s) => s.show);

  const positions = usePortfolioStore((s) => s.positions);
  const addToPosition = usePortfolioStore((s) => s.addToPosition);
  const addPosition = usePortfolioStore((s) => s.addPosition);
  const reducePosition = usePortfolioStore((s) => s.reducePosition);
  const convertPosition = usePortfolioStore((s) => s.convertPosition);

  const position = positions.find((p) => p.fundCode === code && p.groupId === groupId);

  // 未持仓时只显示加仓和定投 tab
  const availableTabs = position
    ? TABS
    : TABS.filter((t) => t.key === 'add' || t.key === 'dip');

  const [activeTab, setActiveTab] = useState<Tab>('add');

  // Add tab state
  const [addShares, setAddShares] = useState('');
  const [addCostNav, setAddCostNav] = useState('');

  // Reduce tab state
  const [reduceShares, setReduceShares] = useState('');

  // DIP (定投) tab state
  const [dipAmount, setDipAmount] = useState('');
  const [dipNav, setDipNav] = useState('');
  const dipShares = useMemo(() => {
    const amt = parseFloat(dipAmount);
    const nav = parseFloat(dipNav);
    if (isNaN(amt) || isNaN(nav) || nav <= 0) return 0;
    return amt / nav;
  }, [dipAmount, dipNav]);

  // Convert tab state
  const [convertShares, setConvertShares] = useState('');
  const [convertQuery, setConvertQuery] = useState('');
  const [selectedFund, setSelectedFund] = useState<FundInfo | null>(null);
  const [convertNav, setConvertNav] = useState('');
  const { results: searchResults, loading: searchLoading } = useFundSearch(convertQuery);

  if (!code) return null;

  const handleAdd = () => {
    const s = parseFloat(addShares);
    const c = parseFloat(addCostNav);
    if (isNaN(s) || s <= 0 || isNaN(c) || c <= 0) {
      showToast('请输入有效的份额和净值');
      return;
    }
    if (position) {
      addToPosition(code, groupId, s, c);
    } else {
      addPosition(code, '', s, c, undefined, groupId);
    }
    showToast('加仓成功');
    setAddShares('');
    setAddCostNav('');
  };

  const handleReduce = () => {
    const s = parseFloat(reduceShares);
    if (isNaN(s) || s <= 0) {
      showToast('请输入有效的份额');
      return;
    }
    if (position && s > position.shares) {
      showToast('减仓份额不能超过持有份额');
      return;
    }
    reducePosition(code, groupId, s);
    if (position && s >= position.shares) {
      showToast('已清仓');
      navigate(-1);
      return;
    }
    showToast('减仓成功');
    setReduceShares('');
  };

  const handleDip = () => {
    const amt = parseFloat(dipAmount);
    const nav = parseFloat(dipNav);
    if (isNaN(amt) || amt <= 0 || isNaN(nav) || nav <= 0) {
      showToast('请输入有效的金额和净值');
      return;
    }
    const shares = amt / nav;
    if (position) {
      addToPosition(code, groupId, shares, nav);
    } else {
      addPosition(code, '', shares, nav, undefined, groupId);
    }
    showToast(`定投成功，买入 ${shares.toFixed(2)} 份`);
    setDipAmount('');
    setDipNav('');
  };

  const handleConvert = () => {
    if (!selectedFund) {
      showToast('请选择目标基金');
      return;
    }
    const s = parseFloat(convertShares);
    const nav = parseFloat(convertNav);
    if (isNaN(s) || s <= 0) {
      showToast('请输入转换份额');
      return;
    }
    if (position && s > position.shares) {
      showToast('转换份额不能超过持有份额');
      return;
    }
    if (isNaN(nav) || nav <= 0) {
      showToast('请输入目标基金净值');
      return;
    }
    convertPosition(code, groupId, selectedFund.code, selectedFund.name, s, nav, selectedFund.type);
    showToast('转换成功');
    if (position && s >= position.shares) {
      navigate(-1);
      return;
    }
    setConvertShares('');
    setConvertNav('');
    setSelectedFund(null);
    setConvertQuery('');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 mr-3 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">{position ? '修改持仓' : '添加持仓'}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {position?.fundName || code}{' '}
              <span className="text-gray-300">({code})</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white mx-3 mt-3 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-center py-3 text-[13px] relative transition-colors ${
                activeTab === tab.key ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Current position info */}
          {position && (
            <div className="bg-blue-50 rounded-lg px-3 py-2.5 mb-4 flex justify-between text-[12px]">
              <span className="text-gray-500">当前持有</span>
              <span className="text-gray-900 font-medium">{position.shares.toFixed(2)} 份 · 成本 {position.costNav.toFixed(4)}</span>
            </div>
          )}

          {activeTab === 'add' && (
            <div className="space-y-4">
              <InputField label="加仓份额" value={addShares} onChange={setAddShares} placeholder="例: 1000" />
              <InputField label="成本净值" value={addCostNav} onChange={setAddCostNav} placeholder="例: 1.2345" step="0.0001" />
              <ActionButton label="确认加仓" onClick={handleAdd} />
            </div>
          )}

          {activeTab === 'reduce' && (
            <div className="space-y-4">
              <InputField label="减仓份额" value={reduceShares} onChange={setReduceShares} placeholder={position ? `最多 ${position.shares.toFixed(2)}` : '请输入份额'} />
              {position && reduceShares && (
                <div className="text-[12px] text-gray-400">
                  减仓后剩余：{Math.max(0, position.shares - (parseFloat(reduceShares) || 0)).toFixed(2)} 份
                  {parseFloat(reduceShares) >= position.shares && (
                    <span className="text-red-400 ml-2">（将清仓此基金）</span>
                  )}
                </div>
              )}
              <ActionButton label="确认减仓" onClick={handleReduce} color="orange" />
            </div>
          )}

          {activeTab === 'dip' && (
            <div className="space-y-4">
              <InputField label="定投金额（元）" value={dipAmount} onChange={setDipAmount} placeholder="例: 500" />
              <InputField label="确认净值" value={dipNav} onChange={setDipNav} placeholder="例: 1.2345" step="0.0001" />
              {dipShares > 0 && (
                <div className="bg-green-50 rounded-lg px-3 py-2.5 text-[12px] flex justify-between">
                  <span className="text-gray-500">预计买入份额</span>
                  <span className="text-green-700 font-medium">{dipShares.toFixed(2)} 份</span>
                </div>
              )}
              <ActionButton label="确认定投" onClick={handleDip} color="green" />
            </div>
          )}

          {activeTab === 'convert' && (
            <div className="space-y-4">
              <InputField
                label="转换份额"
                value={convertShares}
                onChange={setConvertShares}
                placeholder={position ? `最多 ${position.shares.toFixed(2)}` : '请输入份额'}
              />

              {/* Target fund search */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">目标基金</label>
                {selectedFund ? (
                  <div className="flex items-center justify-between border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
                    <div>
                      <span className="text-sm text-gray-900 font-medium">{selectedFund.name}</span>
                      <span className="text-[11px] text-gray-400 ml-2">{selectedFund.code}</span>
                    </div>
                    <button
                      onClick={() => { setSelectedFund(null); setConvertQuery(''); }}
                      className="text-gray-400 text-xs"
                    >
                      更换
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={convertQuery}
                      onChange={(e) => setConvertQuery(e.target.value)}
                      placeholder="搜索基金代码或名称"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                    {(searchResults.length > 0 || searchLoading) && convertQuery && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        {searchLoading && (
                          <div className="px-4 py-3 text-[12px] text-gray-400 text-center">搜索中...</div>
                        )}
                        {searchResults.map((fund) => (
                          <button
                            key={fund.code}
                            onClick={() => {
                              setSelectedFund(fund);
                              setConvertQuery('');
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                          >
                            <span className="text-sm text-gray-900">{fund.name}</span>
                            <span className="text-[11px] text-gray-400 ml-2">{fund.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <InputField label="目标基金净值" value={convertNav} onChange={setConvertNav} placeholder="例: 1.5678" step="0.0001" />

              {convertShares && convertNav && selectedFund && (
                <div className="bg-purple-50 rounded-lg px-3 py-2.5 text-[12px]">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">转出金额</span>
                    <span className="text-gray-700 font-medium">
                      {position ? (parseFloat(convertShares) * position.costNav).toFixed(2) : '--'} 元
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">预计转入</span>
                    <span className="text-purple-700 font-medium">
                      {position
                        ? ((parseFloat(convertShares) * position.costNav) / parseFloat(convertNav)).toFixed(2)
                        : '--'} 份 {selectedFund.name}
                    </span>
                  </div>
                </div>
              )}

              <ActionButton label="确认转换" onClick={handleConvert} color="purple" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Reusable input field */
function InputField({
  label,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );
}

/* Reusable action button */
const colorMap = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-500 hover:bg-purple-600',
};

function ActionButton({
  label,
  onClick,
  color = 'blue',
}: {
  label: string;
  onClick: () => void;
  color?: keyof typeof colorMap;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full ${colorMap[color]} text-white py-3 rounded-xl text-sm font-medium transition-colors`}
    >
      {label}
    </button>
  );
}
