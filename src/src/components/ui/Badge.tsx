import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-light text-primary font-medium',
    success: 'bg-success-bg text-success font-medium',
    warning: 'bg-warning-bg text-warning font-medium',
    danger: 'bg-danger-bg text-danger font-medium',
    info: 'bg-info-bg text-info font-medium',
    neutral: 'bg-surface-hover text-text-muted border border-border font-medium',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
