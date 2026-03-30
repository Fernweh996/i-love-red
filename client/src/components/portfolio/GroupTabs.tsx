import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import BrandIcon from '@/components/shared/BrandIcon';

interface Props {
  activeGroupId: string;
  onGroupChange: (id: string) => void;
  getCount?: (groupId: string) => number;
  totalCount?: number;
}

export default function GroupTabs({ activeGroupId, onGroupChange, getCount: getCountProp }: Props) {
  const groups = usePortfolioStore((s) => s.groups);
  const positions = usePortfolioStore((s) => s.positions);
  const navigate = useNavigate();

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
  const defaultGetCount = (groupId: string) => positions.filter((p) => p.groupId === groupId).length;
  const getCount = getCountProp || defaultGetCount;

  return (
    <div className="flex items-center bg-surface">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-max px-6 py-3 gap-6">
          <button
            onClick={() => onGroupChange('all')}
            className={`text-[15px] transition-colors pb-0.5 ${
              activeGroupId === 'all'
                ? 'text-ink font-medium border-b-2 border-ink'
                : 'text-ink-faint'
            }`}
          >
            全部
          </button>

          {sortedGroups.map((group) => {
            const count = getCount(group.id);
            const isActive = activeGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onGroupChange(group.id)}
                className={`flex items-center gap-1.5 text-[15px] transition-colors pb-0.5 ${
                  isActive
                    ? 'text-ink font-medium border-b-2 border-ink'
                    : 'text-ink-faint'
                }`}
              >
                <BrandIcon groupId={group.id} fallbackIcon={group.icon} size={16} />
                <span>{group.name}</span>
                <span className="text-[14px] text-ink-faint">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => navigate('/groups')}
        className="flex-shrink-0 px-4 py-3 text-ink-faint hover:text-ink transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>
    </div>
  );
}
