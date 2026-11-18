import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف',
  description,
  confirmText = 'حذف',
  cancelText = 'إلغاء',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconConfig = {
    danger: {
      Icon: Trash2,
      bg: 'bg-danger-bg text-danger',
      btnVariant: 'danger' as const,
    },
    warning: {
      Icon: AlertTriangle,
      bg: 'bg-warning-bg text-warning',
      btnVariant: 'primary' as const,
    },
    primary: {
      Icon: Info,
      bg: 'bg-primary-subtle text-primary',
      btnVariant: 'primary' as const,
    },
  }[variant];

  const { Icon, bg, btnVariant } = iconConfig;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={!isLoading}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 text-start">
          <h3 className="text-lg font-bold font-heading text-text-main leading-snug mb-1">
            {title}
          </h3>
          <div className="text-sm text-text-muted leading-relaxed">
            {description}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={btnVariant}
          size="md"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
