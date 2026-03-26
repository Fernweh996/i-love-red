import { useState } from 'react';
import { useFundSearch } from '@/hooks/useFundSearch';
import type { FundInfo } from '@/types';

interface Props {
  onSelect: (fund: FundInfo) => void;
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

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const { results, loading } = useFundSearch(query);
  const [showResults, setShowResults] = useState(true);

  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm mx-4 mt-4">
        <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          placeholder="输入基金代码、名称或拼音"
          className="flex-1 text-sm outline-none bg-transparent"
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            className="text-gray-300 ml-2 hover:text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="mx-4 mt-1 bg-white rounded-xl shadow-lg overflow-hidden max-h-[400px] overflow-y-auto z-40 relative">
          {results.map((fund) => {
            const shortType = fund.type.replace(/型.*$/, '').slice(0, 4);
            return (
              <button
                key={fund.code}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                onClick={() => {
                  onSelect(fund);
                  setShowResults(false);
                }}
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
                <span className="text-blue-500 text-xs ml-3 flex-shrink-0">添加</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
