import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      startIcon,
      endIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active focus:ring-primary shadow-sm',
      secondary:
        'bg-surface-hover text-text-main hover:bg-border active:bg-border-hover focus:ring-border border border-border',
      outline:
        'border border-border text-text-main hover:bg-surface-hover active:bg-border focus:ring-primary',
      ghost:
        'text-text-main hover:bg-surface-hover active:bg-border focus:ring-primary',
      danger:
        'bg-danger text-danger-foreground hover:bg-danger-hover focus:ring-danger shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-sm gap-1.5',
      md: 'text-sm px-4 py-2 rounded-md gap-2',
      lg: 'text-base px-6 py-2.5 rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Spinner size={size === 'lg' ? 'md' : 'sm'} color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} />}
        {!isLoading && startIcon && <span className="inline-flex shrink-0">{startIcon}</span>}
        <span>{children}</span>
        {!isLoading && endIcon && <span className="inline-flex shrink-0">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
