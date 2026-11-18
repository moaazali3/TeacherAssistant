import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface border border-dashed border-border rounded-2xl transition-all',
        className
      )}
    >
      <div className="mb-4 p-4 rounded-2xl bg-surface-hover text-primary shadow-xs">
        {icon || <Inbox className="w-10 h-10 stroke-[1.5]" />}
      </div>
      <h3 className="text-lg font-bold text-text-main font-heading">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-md mt-1.5 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
