import { formatPercent, formatCurrency, getPriceColor } from '@/lib/utils';

interface Props {
  value: number;
  type?: 'percent' | 'currency';
  className?: string;
  showSign?: boolean;
}

export default function PriceChange({ value, type = 'percent', className = '' }: Props) {
  const colorClass = getPriceColor(value);
  const formatted = type === 'percent' ? formatPercent(value) : formatCurrency(value);
  const sign = type === 'currency' && value > 0 ? '+' : '';

  return (
    <span className={`${colorClass} ${className}`}>
      {type === 'currency' ? `${sign}${formatted}` : formatted}
    </span>
  );
}
