import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
};

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  const autoId = useId();
  const inputId = htmlFor ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      {children({ inputId, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-foreground-muted text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
