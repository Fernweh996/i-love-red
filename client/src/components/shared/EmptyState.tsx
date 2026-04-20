export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-secondary mb-4">{description}</p>}
      {action}
    </div>
  );
}
