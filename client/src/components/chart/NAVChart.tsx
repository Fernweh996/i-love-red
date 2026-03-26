import { useState, useMemo } from 'react';
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

interface Props {
  code: string;
}

export default function NAVChart({ code }: Props) {
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
  const lineColor = overallChange >= 0 ? '#ef4444' : '#22c55e';

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
        <p className="text-center text-xs text-gray-400 py-10">{error}</p>
      ) : (
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              {startNav > 0 && (
                <ReferenceLine
                  y={startNav}
                  stroke="#d1d5db"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minNav, maxNav]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v: number) => v.toFixed(3)}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
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
    </div>
  );
}
