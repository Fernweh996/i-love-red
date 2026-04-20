import { usePortfolioStore } from '@/stores/portfolio';

interface Props {
  value: string;
  onChange: (groupId: string) => void;
}

export default function GroupSelector({ value, onChange }: Props) {
  const groups = usePortfolioStore((s) => s.groups);
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div>
      <label className="text-xs text-ink-secondary mb-1 block">选择分组</label>
      <div className="flex flex-wrap gap-2">
        {sortedGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
              value === g.id
                ? 'bg-accent/10 text-accent ring-1 ring-accent/30'
                : 'bg-surface-bg text-ink-secondary'
            }`}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}
