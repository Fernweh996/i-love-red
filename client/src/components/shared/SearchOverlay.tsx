import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFundSearch } from '@/hooks/useFundSearch';
import type { FundInfo } from '@/types';

interface Props {
  onClose: () => void;
}

function fundTypeColor(type: string): string {
  if (type.includes('指数')) return 'bg-purple-50 text-purple-500';
  if (type.includes('混合')) return 'bg-blue-50 text-blue-500';
  if (type.includes('股票')) return 'bg-red-50 text-red-500';
  if (type.includes('债券')) return 'bg-green-50 text-green-600';
  if (type.includes('货币')) return 'bg-gray-100 text-gray-500';
  if (type.includes('QDII')) return 'bg-orange-50 text-orange-500';
  return 'bg-gray-100 text-gray-500';
}

export default function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const { results, loading } = useFundSearch(query);
  const navigate = useNavigate();

  const handleSelect = (fund: FundInfo) => {
    onClose();
    navigate(`/fund/${fund.code}`);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Search header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3 py-2.5">
          <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入基金代码、名称或拼音"
            className="flex-1 text-sm outline-none bg-transparent"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />
          )}
        </div>
        <button onClick={onClose} className="text-[14px] text-gray-500 flex-shrink-0">
          取消
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() && (
          <p className="text-center text-xs text-gray-400 mt-8">支持基金代码、名称、拼音搜索</p>
        )}
        {results.map((fund) => {
          const shortType = fund.type.replace(/型.*$/, '').slice(0, 4);
          return (
            <button
              key={fund.code}
              className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 border-b border-gray-50"
              onClick={() => handleSelect(fund)}
            >
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{fund.name}</p>
                  <span className={`flex-shrink-0 text-[9px] px-1.5 py-[1px] rounded ${fundTypeColor(fund.type)}`}>
                    {shortType}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{fund.code}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
