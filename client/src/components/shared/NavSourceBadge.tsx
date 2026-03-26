interface Props {
  source: 'estimate' | 'confirmed' | undefined;
}

/**
 * 估/净 标签 — 区分估算值和官方确认净值
 * - 估：蓝色小标签 (estimate)
 * - 净：琥珀色小标签 (confirmed)
 */
export default function NavSourceBadge({ source }: Props) {
  if (source === 'confirmed') {
    return (
      <span className="inline-flex items-center text-[9px] text-amber-600 bg-amber-50 px-1 py-[1px] rounded leading-tight">
        净
      </span>
    );
  }

  // Default to estimate badge
  return (
    <span className="inline-flex items-center text-[9px] text-blue-500 bg-blue-50 px-1 py-[1px] rounded leading-tight">
      估
    </span>
  );
}
