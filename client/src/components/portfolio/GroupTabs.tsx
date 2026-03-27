import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import BrandIcon from '@/components/shared/BrandIcon';

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
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[15px] transition-all ${
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
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[15px] transition-all flex items-center gap-1.5 ${
                  activeGroupId === group.id
                    ? 'bg-morandi-blue/15 text-morandi-blue font-medium shadow-sm'
                    : 'bg-white/60 text-gray-400'
                }`}
              >
                <BrandIcon groupId={group.id} fallbackIcon={group.icon} size={20} />
                <span>{group.name}</span>
                <span className="text-[12px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Management icon — artistic slider/equalizer style */}
      <button
        onClick={() => navigate('/groups')}
        className="flex-shrink-0 px-3 py-2 text-gray-400 hover:text-morandi-blue transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>
    </div>
  );
}
