import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  heading: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  heading,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {Icon && (
        <div className="mb-4 p-3 bg-slate-100 text-content-muted">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-base font-semibold text-content-primary mb-1">{heading}</h3>
      {description && (
        <p className="text-sm text-content-secondary max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export default EmptyState;
