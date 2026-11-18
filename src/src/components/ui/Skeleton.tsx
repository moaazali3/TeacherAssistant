import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-hover/80', className)}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-5 rounded-2xl border border-border bg-surface space-y-4 text-start', className)}>
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonRow: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-4 rounded-xl border border-border bg-surface flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1 max-w-sm">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
};
