import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import BrandIcon from '@/components/shared/BrandIcon';

interface Props {
  activeGroupId: string;
  onGroupChange: (id: string) => void;
  getCount?: (groupId: string) => number;
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
    <div className="flex items-center bg-white pt-1 pb-1">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-max px-4 gap-1">
          {/* "账户汇总" tab */}
          <button
            onClick={() => onGroupChange('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[15px] transition-all ${
              activeGroupId === 'all'
                ? 'bg-ios-blue text-white font-medium'
                : 'text-ios-label'
            }`}
          >
            账户汇总
          </button>

          {/* Group tabs */}
          {sortedGroups.map((group) => {
            const count = getCount(group.id);
            const isActive = activeGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onGroupChange(group.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[15px] transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-ios-blue text-white font-medium'
                    : 'text-ios-label'
                }`}
              >
                <BrandIcon groupId={group.id} fallbackIcon={group.icon} size={18} />
                <span>{group.name}</span>
                <span className={`text-[12px] ${isActive ? 'text-white/70' : 'text-ios-gray'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Management icon */}
      <button
        onClick={() => navigate('/groups')}
        className="flex-shrink-0 px-3 py-2 text-ios-blue transition-colors"
      >
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>
    </div>
  );
}
