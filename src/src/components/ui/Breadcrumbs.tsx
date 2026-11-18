import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="مسار التنقل" className={cn('flex items-center text-xs text-text-muted text-start mb-2', className)}>
      <ol className="flex items-center flex-wrap gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronLeft className="w-3.5 h-3.5 text-text-subtle shrink-0" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'font-bold truncate max-w-xs',
                    isLast ? 'text-text-main' : 'text-text-muted'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="inline-flex me-1">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-primary transition-colors flex items-center gap-1 truncate max-w-xs focus-visible:ring-1 focus-visible:ring-primary rounded"
                >
                  {item.icon && <span className="inline-flex">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
