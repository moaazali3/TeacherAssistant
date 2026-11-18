import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface PageLayoutProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  skeleton?: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  isLoading = false,
  skeleton,
  error = null,
  onRetry,
  className,
  children,
}) => {
  return (
    <div className={cn('w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}

      {/* Header section */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border mb-6">
          <div className="text-start">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main font-heading tracking-tight">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm sm:text-base text-text-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Loading state with Skeleton */}
      {isLoading ? (
        skeleton ? (
          <div>{skeleton}</div>
        ) : (
          <div className="space-y-4 py-8">
            <div className="h-8 w-1/3 bg-surface-hover rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-surface-hover rounded-2xl animate-pulse" />
              <div className="h-64 bg-surface-hover rounded-2xl animate-pulse" />
              <div className="h-64 bg-surface-hover rounded-2xl animate-pulse" />
            </div>
          </div>
        )
      ) : error ? (
        /* Error state */
        <div className="p-6 sm:p-8 bg-danger-bg/40 border border-danger/30 rounded-2xl text-center max-w-xl mx-auto my-12 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-1">حدث خطأ أثناء تحميل الصفحة</h3>
          <p className="text-sm text-text-muted mb-5 leading-relaxed">{error}</p>
          {onRetry && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRetry}
              startIcon={<RefreshCw className="w-4 h-4" />}
            >
              إعادة المحاولة
            </Button>
          )}
        </div>
      ) : (
        /* Normal content */
        <div>{children}</div>
      )}
    </div>
  );
};
