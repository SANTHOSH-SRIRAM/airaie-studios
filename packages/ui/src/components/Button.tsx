import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primary-hover active:bg-brand-primary-hover border border-transparent',
  secondary:
    'bg-white text-content-primary border border-surface-border hover:bg-surface-hover active:bg-slate-100',
  ghost:
    'bg-transparent text-content-secondary hover:bg-slate-100 active:bg-slate-200 border border-transparent',
  outline:
    'bg-transparent text-brand-primary border border-brand-primary hover:bg-surface-layer active:bg-surface-hover',
  danger:
    'bg-status-danger text-white hover:bg-red-600 active:bg-red-700 border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2.5',
};

const iconSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const iconSize = iconSizes[size];

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'rounded-none', // enforce sharp corners
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : Icon ? (
          <Icon size={iconSize} />
        ) : null}
        {children}
        {IconRight && !loading && <IconRight size={iconSize} />}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
