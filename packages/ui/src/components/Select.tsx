import React, { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, options, placeholder, error, wrapperClassName, className, id, ...props },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-content-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-9 px-3 pr-9 text-sm bg-white border border-surface-border rounded-none',
              'text-content-primary appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150',
              error && 'border-status-danger focus:ring-status-danger',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
          />
        </div>
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
