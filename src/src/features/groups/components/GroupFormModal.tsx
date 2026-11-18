import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GroupDto, CreateGroupDto, UpdateGroupDto } from '../types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/api';
import { Users } from 'lucide-react';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupDto | UpdateGroupDto) => Promise<void>;
  initialData?: GroupDto | null;
  subjectTitle?: string;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjectTitle,
}) => {
  const [name, setName] = useState('');
  const [scheduleText, setScheduleText] = useState('');
  const [isGroupOpen, setIsGroupOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setScheduleText(initialData.scheduleText || '');
      setIsGroupOpen(initialData.isOpen);
    } else {
      setName('');
      setScheduleText('');
      setIsGroupOpen(true);
    }
    setNameError(null);
    setGeneralError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNameError('اسم المجموعة مطلوب ويجب ألا يقل عن حرفين');
      return;
    }

    try {
      setIsSubmitting(true);
      setNameError(null);
      setGeneralError(null);
      await onSubmit({
        name: trimmedName,
        scheduleText: scheduleText.trim() || undefined,
        isOpen: isGroupOpen,
      });
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const errors = err.response.data?.errors;
        const msg = err.response.data?.message;
        if (Array.isArray(errors) && errors.length > 0) {
          const first = errors[0];
          if (typeof first === 'string' && (first.toLowerCase().includes('name') || first.includes('الاسم'))) {
            setNameError(first);
            return;
          }
          setGeneralError(errors.join(' | '));
          return;
        }
        if (msg) {
          if (msg.toLowerCase().includes('name') || msg.includes('الاسم')) {
            setNameError(msg);
            return;
          }
          setGeneralError(msg);
          return;
        }
      }

      setGeneralError(getApiErrorMessage(err, 'فشل حفظ بيانات المجموعة'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span>{initialData ? 'تعديل بيانات المجموعة' : 'إنشاء مجموعة جديدة'}</span>
        </div>
      }
      description={
        subjectTitle ? (
          <span>
            المادة: <strong className="text-text-main">{subjectTitle}</strong>
          </span>
        ) : undefined
      }
      showCloseButton={!isSubmitting}
    >
      {generalError && (
        <div className="mb-4 p-3 rounded-xl bg-danger-bg text-danger text-sm font-medium border border-danger/30" role="alert">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="اسم المجموعة"
          required
          placeholder="مثال: مجموعة الأحد والأربعاء - سنتر الأمل"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          error={nameError || undefined}
          disabled={isSubmitting}
        />

        <Input
          label="المواعيد والتفاصيل (اختياري)"
          placeholder="مثال: الأحد والأربعاء من 4:00 إلى 6:00 مساءً"
          value={scheduleText}
          onChange={(e) => setScheduleText(e.target.value)}
          disabled={isSubmitting}
        />

        <div className="bg-surface-subtle border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-bold text-text-main block">مفتوحة لانضمام الطلاب</span>
            <span className="text-xs text-text-muted">
              عند التفعيل، يمكن للطلاب الانضمام لهذه المجموعة باستخدام كود الانضمام.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isGroupOpen}
              onChange={(e) => setIsGroupOpen(e.target.checked)}
              disabled={isSubmitting}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-bold">
            {initialData ? 'حفظ التعديلات' : 'إنشاء المجموعة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
