import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useFundHistory, type Period } from '@/hooks/useFundHistory';
import PeriodSelector from './PeriodSelector';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const MAX_LIST_ROWS = 30;

interface Props {
  code: string;
  groupId?: string;
}

export default function NAVChart({ code, groupId }: Props) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('3m');
  const { records, loading, error } = useFundHistory(code, period);

  const chartData = useMemo(() => {
    return records.map((r) => ({
      date: r.date.slice(5),
      fullDate: r.date,
      nav: r.nav,
    }));
  }, [records]);

  const [minNav, maxNav] = useMemo(() => {
    if (records.length === 0) return [0, 1];
    const navs = records.map((r) => r.nav);
    const min = Math.min(...navs);
    const max = Math.max(...navs);
    const padding = (max - min) * 0.1 || 0.01;
    return [min - padding, max + padding];
  }, [records]);

  const overallChange = useMemo(() => {
    if (records.length < 2) return 0;
    const first = records[0].nav;
    const last = records[records.length - 1].nav;
    return ((last - first) / first) * 100;
  }, [records]);

  const startNav = records.length > 0 ? records[0].nav : 0;
  const lineColor = overallChange >= 0 ? '#D94030' : '#2E8B57';

  // Records newest-first for the list display
  const listRecords = useMemo(() => {
    return [...records].reverse();
  }, [records]);

  const displayRecords = listRecords.slice(0, MAX_LIST_ROWS);
  const showViewAll = listRecords.length > MAX_LIST_ROWS;

  return (
    <div className="px-3 pb-4">
      {/* Period selector + change summary */}
      <div className="flex items-center justify-between pt-3 pb-2">
        <PeriodSelector value={period} onChange={setPeriod} />
        {records.length > 0 && (
          <span className={`text-xs font-medium ${overallChange >= 0 ? 'text-rise' : 'text-fall'}`}>
            {overallChange >= 0 ? '+' : ''}{overallChange.toFixed(2)}%
          </span>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="加载历史数据..." />
      ) : error ? (
        <p className="text-center text-xs text-ink-faint py-10">{error}</p>
      ) : (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              {startNav > 0 && (
                <ReferenceLine
                  y={startNav}
                  stroke="#DCDFE5"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9498A3' }}
                axisLine={{ stroke: '#E8EAEF' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minNav, maxNav]}
                tick={{ fontSize: 10, fill: '#9498A3' }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v: number) => v.toFixed(3)}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid #DCDFE5',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  padding: '6px 10px',
                }}
                formatter={(value: number) => [value.toFixed(4), '净值']}
                labelFormatter={(_: string, payload: any[]) =>
                  payload?.[0]?.payload?.fullDate || _
                }
              />
              <Line
                type="monotone"
                dataKey="nav"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* NAV History List */}
      {!loading && !error && records.length > 0 && (
        <div className="border-t border-border-light mt-2">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[13px] font-medium text-ink">过往净值</span>
            <span className="text-[11px] text-ink-faint">共{listRecords.length}个交易日</span>
          </div>
          <div className="px-3">
            <div className="flex text-[11px] text-ink-faint pb-1.5 border-b border-border-light">
              <span className="flex-1">日期</span>
              <span className="w-20 text-right">单位净值</span>
              <span className="w-20 text-right">日涨幅</span>
            </div>
            {displayRecords.map((r) => (
              <div key={r.date} className="flex items-center text-[12px] py-2 border-b border-border-light last:border-b-0">
                <span className="flex-1 text-ink-secondary">{r.date}</span>
                <span className="w-20 text-right text-ink">{r.nav.toFixed(4)}</span>
                <span className={`w-20 text-right font-medium ${
                  r.changeRate > 0 ? 'text-rise' : r.changeRate < 0 ? 'text-fall' : 'text-ink-faint'
                }`}>
                  {r.changeRate > 0 ? '+' : ''}{r.changeRate.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          {showViewAll && (
            <button
              onClick={() => navigate(`/fund/${code}/history${groupId ? `?group=${groupId}` : ''}`)}
              className="w-full py-3 text-[13px] text-accent border-t border-border-light flex items-center justify-center gap-1"
            >
              查看历史净值
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
