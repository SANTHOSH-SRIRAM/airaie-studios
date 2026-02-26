import React, { forwardRef, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 px-3 text-sm bg-white border border-surface-border rounded-none',
              'text-content-primary placeholder:text-content-muted',
              'focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150',
              Icon && 'pl-9',
              error && 'border-status-danger focus:ring-status-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
