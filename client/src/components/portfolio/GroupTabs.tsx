import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';

interface Props {
  activeGroupId: string;
  onGroupChange: (id: string) => void;
  /** Count per group — if not provided, uses portfolio positions */
  getCount?: (groupId: string) => number;
  /** Total count for "汇总" tab */
  totalCount?: number;
}

export default function GroupTabs({ activeGroupId, onGroupChange, getCount: getCountProp, totalCount }: Props) {
  const groups = usePortfolioStore((s) => s.groups);
  const positions = usePortfolioStore((s) => s.positions);
  const navigate = useNavigate();

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  const defaultGetCount = (groupId: string) =>
    positions.filter((p) => p.groupId === groupId).length;

  const getCount = getCountProp || defaultGetCount;

  return (
    <div className="flex items-center bg-morandi-bg pt-2 pb-1">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-max px-3 gap-2">
          {/* "账户汇总" tab */}
          <button
            onClick={() => onGroupChange('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${
              activeGroupId === 'all'
                ? 'bg-morandi-blue/15 text-morandi-blue font-medium shadow-sm'
                : 'bg-white/60 text-gray-400'
            }`}
          >
            账户汇总
          </button>

          {/* Group tabs */}
          {sortedGroups.map((group) => {
            const count = getCount(group.id);
            return (
              <button
                key={group.id}
                onClick={() => onGroupChange(group.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${
                  activeGroupId === group.id
                    ? 'bg-morandi-blue/15 text-morandi-blue font-medium shadow-sm'
                    : 'bg-white/60 text-gray-400'
                }`}
              >
                {group.icon} {group.name}
                <span className="ml-0.5 text-[10px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed gear icon */}
      <button
        onClick={() => navigate('/groups')}
        className="flex-shrink-0 px-3 py-2 text-gray-300 text-[14px] hover:text-gray-500 transition-colors"
      >
        ⚙
      </button>
    </div>
  );
}
