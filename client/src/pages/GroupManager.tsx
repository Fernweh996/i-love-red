import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolio';
import { useWatchlistStore } from '@/stores/watchlist';
import { useToastStore } from '@/stores/toast';

const EMOJI_OPTIONS = ['📊', '💳', '🏦', '💵', '🎯', '📱', '🏠', '✈️', '💰', '🔵', '📂', '⭐'];

export default function GroupManagerPage() {
  const groups = usePortfolioStore((s) => s.groups);
  const positions = usePortfolioStore((s) => s.positions);
  const addGroup = usePortfolioStore((s) => s.addGroup);
  const updateGroup = usePortfolioStore((s) => s.updateGroup);
  const removeGroup = usePortfolioStore((s) => s.removeGroup);
  const clearGroup = usePortfolioStore((s) => s.clearGroup);
  const watchItems = useWatchlistStore((s) => s.items);
  const clearWatchGroup = useWatchlistStore((s) => s.clearGroup);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();

  const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📊');

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  const getPositionCount = (groupId: string) =>
    positions.filter((p) => p.groupId === groupId).length;

  const getWatchCount = (groupId: string) =>
    watchItems.filter((i) => i.groupId === groupId).length;

  const handleCreate = () => {
    if (!name.trim()) return;
    addGroup(name.trim(), icon);
    showToast('分组已创建');
    setMode('list');
    setName('');
    setIcon('📊');
  };

  const handleUpdate = () => {
    if (!editingId || !name.trim()) return;
    updateGroup(editingId, name.trim(), icon);
    showToast('分组已更新');
    setMode('list');
    setEditingId(null);
    setName('');
    setIcon('📊');
  };

  const handleDelete = (id: string, groupName: string) => {
    const pCount = getPositionCount(id);
    const msg = pCount > 0
      ? `删除分组"${groupName}"后，其中 ${pCount} 只持仓基金将移入"默认"分组，确定删除？`
      : `确定删除分组"${groupName}"？`;
    if (confirm(msg)) {
      removeGroup(id);
      clearWatchGroup(id);
      showToast('分组已删除');
    }
  };

  const handleClear = (id: string, groupName: string) => {
    const pCount = getPositionCount(id);
    const wCount = getWatchCount(id);
    const total = pCount + wCount;
    if (total === 0) return;
    const parts = [];
    if (pCount > 0) parts.push(`${pCount} 只持仓`);
    if (wCount > 0) parts.push(`${wCount} 只自选`);
    if (confirm(`确定清空"${groupName}"中的 ${parts.join(' 和 ')}？此操作不可撤销。`)) {
      if (pCount > 0) clearGroup(id);
      if (wCount > 0) clearWatchGroup(id);
      showToast(`已清空 ${total} 只基金`);
    }
  };

  const startEdit = (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    setEditingId(id);
    setName(group.name);
    setIcon(group.icon);
    setMode('edit');
  };

  const startCreate = () => {
    setEditingId(null);
    setName('');
    setIcon('📊');
    setMode('create');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 px-4 py-3 flex items-center">
        <button onClick={() => mode === 'list' ? navigate(-1) : setMode('list')} className="p-1 -ml-1 mr-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[16px] font-semibold text-ink">
          {mode === 'list' ? '账户管理' : mode === 'create' ? '新建分组' : '编辑分组'}
        </h1>
      </div>

      {mode === 'list' ? (
        <div className="max-w-lg mx-auto p-4">
          {/* Group list */}
          <div className="space-y-2 mb-4">
            {sortedGroups.map((group) => {
              const pCount = getPositionCount(group.id);
              const wCount = getWatchCount(group.id);
              const total = pCount + wCount;
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{group.icon}</span>
                    <div>
                      <span className="text-[14px] text-ink font-medium">{group.name}</span>
                      {group.isPreset && (
                        <span className="ml-1.5 text-[10px] text-ink-faint bg-surface-bg px-1.5 py-0.5 rounded">预设</span>
                      )}
                      <p className="text-[11px] text-ink-faint mt-0.5">
                        {pCount > 0 && `${pCount} 只持仓`}
                        {pCount > 0 && wCount > 0 && ' · '}
                        {wCount > 0 && `${wCount} 只自选`}
                        {total === 0 && '暂无基金'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {total > 0 && (
                      <button
                        onClick={() => handleClear(group.id, group.name)}
                        className="text-[12px] text-[#A67B20] px-2.5 py-1.5 rounded-lg active:bg-orange-50"
                      >
                        清空
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(group.id)}
                      className="text-[12px] text-accent px-2.5 py-1.5 rounded-lg active:bg-blue-50"
                    >
                      编辑
                    </button>
                    {!group.isPreset && (
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="text-[12px] text-rise px-2.5 py-1.5 rounded-lg active:bg-red-50"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create button */}
          <button
            onClick={startCreate}
            className="w-full bg-accent text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            + 新建分组
          </button>

          {/* Settings link */}
          <Link
            to="/settings"
            className="block text-center text-[13px] text-ink-faint mt-6 py-2 active:text-gray-600"
          >
            ⚙ 应用设置
          </Link>
        </div>
      ) : (
        /* Create / Edit form */
        <div className="max-w-lg mx-auto p-4 space-y-4">
          <div className="bg-surface rounded-xl p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">分组名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 我的基金"
                maxLength={10}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">选择图标</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setIcon(emoji)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-colors ${
                      icon === emoji
                        ? 'bg-accent/10 ring-2 ring-accent'
                        : 'bg-surface-bg hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={mode === 'create' ? handleCreate : handleUpdate}
              disabled={!name.trim()}
              className="w-full bg-accent text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'create' ? '确认创建' : '保存修改'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
