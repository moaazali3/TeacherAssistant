import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GroupMemberDto } from '../types';
import { resetPasswordSchema, ResetPasswordFormData } from '@/features/auth/schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { applyServerValidationErrors, getApiErrorMessage } from '@/lib/api';
import { KeyRound, ShieldAlert } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: GroupMemberDto | null;
  onConfirmReset: (studentId: string, newPassword: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmReset,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isOpen) {
      reset({ newPassword: '' });
      setGeneralError(null);
    }
  }, [isOpen, reset]);

  if (!student) return null;

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setGeneralError(null);
      await onConfirmReset(student.studentId, data.newPassword);
      reset({ newPassword: '' });
      onClose();
    } catch (err: unknown) {
      const unhandled = applyServerValidationErrors(err, setError, {
        fieldMap: {
          newPassword: 'newPassword',
          password: 'newPassword',
        },
      });

      if (unhandled) {
        setGeneralError(getApiErrorMessage(err, unhandled));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2 text-warning">
          <KeyRound className="w-5 h-5 text-warning" />
          <span className="text-text-main">إعادة تعيين كلمة مرور الطالب</span>
        </div>
      }
      showCloseButton={!isSubmitting}
    >
      {generalError && (
        <div className="mb-4 p-3 rounded-xl bg-danger-bg text-danger text-sm font-medium border border-danger/30" role="alert">
          {generalError}
        </div>
      )}

      <div className="bg-surface-subtle border border-border rounded-xl p-3.5 mb-4 text-sm space-y-1">
        <p>
          <span className="text-text-muted">الطالب: </span>
          <span className="font-bold text-text-main">{student.name}</span>
        </p>
        <p className="text-xs text-text-muted font-mono">
          {student.email}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="كلمة المرور الجديدة"
          type="password"
          required
          placeholder="8 أحرف على الأقل"
          startAdornment={<KeyRound className="w-4 h-4 text-text-subtle" />}
          error={errors.newPassword?.message}
          helperText="8 أحرف على الأقل، تتضمن حرفاً ورقماً."
          disabled={isSubmitting}
          {...register('newPassword')}
        />

        <p className="text-xs text-text-muted flex items-start gap-1.5 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <span>سيتم استبدال كلمة المرور الحالية للطالب فوراً بالكلمة المدخلة أعلاه.</span>
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-bold">
            تأكيد التعيين
          </Button>
        </div>
      </form>
    </Modal>
  );
};
