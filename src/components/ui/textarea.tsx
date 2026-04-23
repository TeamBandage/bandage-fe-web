import { forwardRef, type TextareaHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Field } from './field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

const baseClasses =
  'min-h-[96px] w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:opacity-50 disabled:cursor-not-allowed resize-y';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, id, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {({ inputId, describedBy }) => (
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            baseClasses,
            error ? 'border-danger' : 'border-border hover:border-border-hi',
            className,
          )}
          {...props}
        />
      )}
    </Field>
  );
});
