import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startAdornment,
      endAdornment,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-main mb-1.5 select-none"
          >
            {label}
            {props.required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {startAdornment && (
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-text-muted">
              {startAdornment}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full bg-surface text-text-main border rounded-lg px-3.5 py-2 text-sm transition-colors text-start placeholder:text-text-subtle',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
              error ? 'border-danger focus-visible:ring-danger' : 'border-border hover:border-border-hover',
              disabled && 'bg-surface-subtle text-text-subtle cursor-not-allowed border-border',
              startAdornment ? 'ps-10' : '',
              endAdornment ? 'pe-10' : '',
              className
            )}
            {...props}
          />

          {endAdornment && (
            <div className="absolute inset-y-0 end-0 pe-3 flex items-center text-text-muted">
              {endAdornment}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
