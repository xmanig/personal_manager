interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/30',
    primary: 'bg-primary-container/10 text-primary border border-primary-container/20',
    success: 'bg-secondary-container/20 text-secondary border border-secondary-container/30',
    warning: 'bg-tertiary-container/20 text-tertiary border border-tertiary-container/30',
    danger: 'bg-error-container/10 text-error border border-error-container/20',
  };

  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
