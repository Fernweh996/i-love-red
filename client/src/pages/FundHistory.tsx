import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getFundHistory, getFundEstimate } from '@/api';
import type { NavRecord } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const PAGE_SIZE = 30;

export default function FundHistoryPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group') || '';

  const [fundName, setFundName] = useState('');
  const [records, setRecords] = useState<NavRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch fund name
  useEffect(() => {
    if (!code) return;
    getFundEstimate(code)
      .then((est) => setFundName(est.name))
      .catch(() => {});
  }, [code]);

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!code) return;
      setLoading(true);
      try {
        const data = await getFundHistory(code, pageNum, PAGE_SIZE);
        setTotalCount(data.totalCount);
        if (pageNum === 1) {
          setRecords(data.records);
        } else {
          setRecords((prev) => [...prev, ...data.records]);
        }
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const hasMore = records.length < totalCount;

  if (!code) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-6">
      {/* Header */}
      <div className="bg-surface sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 mr-3 text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <p className="text-[15px] font-medium text-ink leading-tight">
              {fundName || '历史净值'}
            </p>
            <p className="text-[11px] text-ink-faint mt-0.5">{code}</p>
          </div>
          <div className="w-5" />
        </div>
      </div>

      {initialLoading ? (
        <LoadingSpinner text="加载历史净值..." />
      ) : (
        <div className="mx-3 mt-3 bg-surface rounded-xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex text-[11px] text-ink-faint px-3 py-2.5 border-b border-gray-100">
            <span className="flex-1">日期</span>
            <span className="w-20 text-right">单位净值</span>
            <span className="w-20 text-right">日涨幅</span>
          </div>

          {/* Records */}
          {records.map((r) => (
            <div
              key={r.date}
              className="flex items-center text-[12px] px-3 py-2 border-b border-gray-50 last:border-b-0"
            >
              <span className="flex-1 text-gray-600">{r.date}</span>
              <span className="w-20 text-right text-gray-800">{r.nav.toFixed(4)}</span>
              <span
                className={`w-20 text-right font-medium ${
                  r.changeRate > 0 ? 'text-rise' : r.changeRate < 0 ? 'text-fall' : 'text-ink-faint'
                }`}
              >
                {r.changeRate > 0 ? '+' : ''}
                {r.changeRate.toFixed(2)}%
              </span>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => loadPage(page + 1)}
              disabled={loading}
              className="w-full py-3 text-[13px] text-accent border-t border-gray-100 disabled:text-gray-300"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}

          {!hasMore && records.length > 0 && (
            <p className="text-center text-[11px] text-gray-300 py-3 border-t border-gray-50">
              已显示全部 {totalCount} 条记录
            </p>
          )}
        </div>
      )}
    </div>
  );
}
