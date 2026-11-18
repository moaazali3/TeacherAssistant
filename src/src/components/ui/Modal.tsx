import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <DialogPrimitive.Content
            className={cn(
              'relative w-full bg-surface text-text-main rounded-2xl shadow-xl border border-border p-6 my-8 text-start focus:outline-none transition-all duration-200 animate-in fade-in zoom-in-95',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-border-subtle">
                <div className="flex-1">
                  {title && (
                    <DialogPrimitive.Title className="text-lg font-bold font-heading text-text-main leading-snug">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                  {description && (
                    <DialogPrimitive.Description className="text-sm text-text-muted mt-1 leading-relaxed">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>

                {showCloseButton && (
                  <DialogPrimitive.Close
                    asChild
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-text-subtle hover:text-text-main hover:bg-surface-hover transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    aria-label="إغلاق النافذة"
                  >
                    <button type="button">
                      <X className="w-5 h-5" />
                    </button>
                  </DialogPrimitive.Close>
                )}
              </div>
            )}

            {/* Body */}
            <div>{children}</div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
