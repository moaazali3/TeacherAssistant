import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'muted';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colors = {
    primary: 'border-primary-light border-t-primary',
    white: 'border-white/30 border-t-white',
    muted: 'border-border border-t-text-muted',
  };

  return (
    <div
      role="status"
      aria-label="جاري التحميل..."
      className={cn('inline-block animate-spin rounded-full', sizes[size], colors[color], className)}
      {...props}
    >
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
};
