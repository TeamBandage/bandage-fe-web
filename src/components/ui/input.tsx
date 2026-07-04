import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Field } from './field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

const baseInputClasses =
  'h-10 w-full rounded-[5px] border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:border-white/70 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, id, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {({ inputId, describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            baseInputClasses,
            'border-border hover:border-border-hi',
            className,
            error &&
              'border-danger hover:border-danger focus-visible:border-danger [&:not(:placeholder-shown)]:border-danger',
          )}
          {...props}
        />
      )}
    </Field>
  );
});
