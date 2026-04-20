import type { Period } from '@/hooks/useFundHistory';

const periods: { value: Period; label: string }[] = [
  { value: '1m', label: '1月' },
  { value: '3m', label: '3月' },
  { value: '6m', label: '6月' },
  { value: '1y', label: '1年' },
  { value: 'all', label: '成立以来' },
];

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

export default function PeriodSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-0.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
            value === p.value
              ? 'bg-accent text-white'
              : 'text-ink-faint hover:text-ink-secondary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
