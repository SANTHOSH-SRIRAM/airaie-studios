import React, { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeStyle = 'filled' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  badgeStyle?: BadgeStyle;
  dot?: boolean;
}

const filledStyles: Record<BadgeVariant, string> = {
  success: 'bg-status-success-light text-green-700',
  warning: 'bg-status-warning-light text-amber-700',
  danger: 'bg-status-danger-light text-red-700',
  info: 'bg-status-info-light text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
};

const outlineStyles: Record<BadgeVariant, string> = {
  success: 'bg-white border border-green-400 text-green-700',
  warning: 'bg-white border border-amber-400 text-amber-700',
  danger: 'bg-white border border-red-400 text-red-700',
  info: 'bg-white border border-blue-400 text-blue-700',
  neutral: 'bg-white border border-slate-300 text-slate-600',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
  neutral: 'bg-slate-400',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  badgeStyle = 'filled',
  dot = false,
  className,
  children,
  ...props
}) => {
  const styles = badgeStyle === 'outline' ? outlineStyles[variant] : filledStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-none',
        styles,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
