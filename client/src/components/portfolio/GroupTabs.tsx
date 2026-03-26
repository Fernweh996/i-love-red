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
  const total = totalCount ?? positions.length;

  return (
    <div className="flex items-center bg-white border-b border-gray-50">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-max px-2">
          {/* "账户汇总" tab — 常驻 */}
          <button
            onClick={() => onGroupChange('all')}
            className={`flex-shrink-0 px-3 py-2.5 text-[13px] relative transition-colors ${
              activeGroupId === 'all'
                ? 'text-blue-500 font-medium'
                : 'text-gray-400'
            }`}
          >
            账户汇总
            {activeGroupId === 'all' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-blue-500 rounded-full" />
            )}
          </button>

          {/* Group tabs */}
          {sortedGroups.map((group) => {
            const count = getCount(group.id);
            return (
              <button
                key={group.id}
                onClick={() => onGroupChange(group.id)}
                className={`flex-shrink-0 px-3 py-2.5 text-[13px] relative transition-colors ${
                  activeGroupId === group.id
                    ? 'text-blue-500 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {group.icon} {group.name}
                <span className="ml-0.5 text-[10px]">({count})</span>
                {activeGroupId === group.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed gear icon — navigates to /groups page */}
      <button
        onClick={() => navigate('/groups')}
        className="flex-shrink-0 px-3 py-2.5 text-gray-400 border-l border-gray-50 text-[14px]"
      >
        ⚙
      </button>
    </div>
  );
}
