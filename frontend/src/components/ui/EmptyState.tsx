interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 rounded-2xl bg-surface-container-high p-4 text-outline">
          {icon}
        </div>
      )}
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
