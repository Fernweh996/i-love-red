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
      <label className="text-xs text-gray-500 mb-1 block">选择分组</label>
      <div className="flex flex-wrap gap-2">
        {sortedGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
              value === g.id
                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}
