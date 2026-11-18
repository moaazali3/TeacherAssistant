import React, { createContext, useContext, useCallback } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id?: string | number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const options = {
        description: title ? message : undefined,
        duration,
      };
      const text = title || message;

      switch (type) {
        case 'success':
          sonnerToast.success(text, options);
          break;
        case 'error':
          sonnerToast.error(text, { ...options, duration: duration || 5000 });
          break;
        case 'warning':
          sonnerToast.warning(text, options);
          break;
        case 'info':
        default:
          sonnerToast.info(text, options);
          break;
      }
    },
    []
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title, 6000), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title), [showToast]);
  const dismiss = useCallback((id?: string | number) => sonnerToast.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      <Toaster
        dir="rtl"
        position="bottom-left"
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'var(--font-family-base)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-main)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          },
          classNames: {
            title: 'font-bold text-sm text-text-main',
            description: 'text-xs text-text-muted mt-0.5',
            closeButton: 'bg-surface hover:bg-surface-hover text-text-muted border-border',
            success: 'text-success',
            error: 'text-danger',
            warning: 'text-warning',
            info: 'text-info',
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
