import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { groupsApi } from '../api';
import { MyGroupDto } from '../types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage, useRateLimitCooldown } from '@/lib/api';
import { UserPlus, KeyRound } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (joinedGroup: MyGroupDto) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { isCoolingDown, countdown, startCooldown } = useRateLimitCooldown(30);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setFieldError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoolingDown) return;

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode || cleanCode.length !== 8) {
      setFieldError('كود الجروب يجب أن يتكون من 8 أحرف وأرقام بالضبط');
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldError(null);
      const joinedGroup = await groupsApi.joinGroup(cleanCode);
      success(`تم انضمامك بنجاح إلى مجموعة «${joinedGroup.groupName}» لمادة «${joinedGroup.subjectTitle}»!`);
      setCode('');
      onSuccess?.(joinedGroup);
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          startCooldown(30);
          return; // Toast handled globally by axios interceptor
        }

        if (err.response?.status === 409) {
          const msg = 'أنت منضم بالفعل إلى مجموعة في هذه المادة.';
          setFieldError(msg);
          return;
        }

        if (err.response?.status === 400 || err.response?.status === 404) {
          const apiMsg = err.response.data?.message;
          const msg = apiMsg || 'كود الانضمام غير صحيح، أو أن المجموعة مغلقة حالياً.';
          setFieldError(msg);
          return;
        }
      }

      const msg = getApiErrorMessage(err, 'فشل الانضمام إلى المجموعة');
      setFieldError(msg);
      toastError(msg);
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
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <span>الانضمام لمجموعة أخرى</span>
        </div>
      }
      description="أدخل الكود المكوّن من 8 خانات المقدم من المعلم"
      showCloseButton={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="كود الجروب"
            required
            placeholder="مثال: SAT5CHEM"
            maxLength={8}
            dir="ltr"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (fieldError) setFieldError(null);
            }}
            startAdornment={<KeyRound className="w-4 h-4 text-text-subtle" />}
            className="font-mono uppercase tracking-widest text-center text-lg font-bold"
            error={fieldError || undefined}
            helperText="أدخل كود الجروب المكون من 8 خانات المقدم من المعلم للانضمام المباشر."
            disabled={isSubmitting || isCoolingDown}
            autoFocus
          />
        </div>

        {isCoolingDown && (
          <p className="text-xs text-warning text-center font-medium bg-warning-bg border border-warning/30 rounded-lg py-1.5 px-3">
            تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار {countdown} ثانية.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={code.trim().length !== 8 || isSubmitting || isCoolingDown}
            className="font-bold"
          >
            {isCoolingDown ? `يرجى الانتظار (${countdown} ثانية)` : 'انضمام للمجموعة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
