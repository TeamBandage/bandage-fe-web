import { ChevronDown } from 'lucide-react';
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { Field } from './field';

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  options: ReadonlyArray<SelectOption>;
}

const baseClasses =
  'h-10 w-full appearance-none rounded-md border bg-surface pl-3 pr-9 text-sm text-foreground ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, id, placeholder, options, value, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {({ inputId, describedBy }) => (
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={cn(
              baseClasses,
              error ? 'border-danger' : 'border-border hover:border-border-hi',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden={value !== undefined && value !== ''}>
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
            aria-hidden="true"
            className="text-foreground-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
          />
        </div>
      )}
    </Field>
  );
});
