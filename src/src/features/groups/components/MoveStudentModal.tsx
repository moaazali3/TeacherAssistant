import React, { useState } from 'react';
import { GroupDto, GroupMemberDto } from '../types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { UserCheck, ArrowRightLeft } from 'lucide-react';

interface MoveStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: GroupMemberDto | null;
  currentGroupId: string;
  availableGroups: GroupDto[];
  onConfirmMove: (studentId: string, targetGroupId: string) => Promise<void>;
}

export const MoveStudentModal: React.FC<MoveStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  currentGroupId,
  availableGroups,
  onConfirmMove,
}) => {
  const eligibleGroups = availableGroups.filter((g) => g.id !== currentGroupId);
  const [selectedGroupId, setSelectedGroupId] = useState(eligibleGroups[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      setError('يرجى اختيار المجموعة الهدف');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmMove(student.studentId, selectedGroupId);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('فشل نقل الطالب');
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
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <span>نقل الطالب لمجموعة أخرى</span>
        </div>
      }
      showCloseButton={!isSubmitting}
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger-bg text-danger text-sm font-medium border border-danger/30">
          {error}
        </div>
      )}

      <div className="bg-surface-subtle border border-border rounded-xl p-3.5 mb-4 space-y-1.5 text-sm">
        <p className="flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="text-text-muted">اسم الطالب: </span>
          <span className="font-bold text-text-main">{student.name}</span>
        </p>
        <p>
          <span className="text-text-muted">البريد الإلكتروني: </span>
          <span className="text-text-main font-mono text-xs">{student.email}</span>
        </p>
        <p>
          <span className="text-text-muted">المجموعة الحالية: </span>
          <span className="text-primary font-medium">{student.groupName}</span>
        </p>
      </div>

      {eligibleGroups.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-text-muted mb-4 leading-relaxed">
            لا توجد مجموعات أخرى لهذه المادة حالياً. قم بإنشاء مجموعة جديدة أولاً لتتمكن من نقل الطالب إليها.
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">
              اختر المجموعة الهدف
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
            >
              {eligibleGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.studentsCount} طالب) {g.scheduleText ? `- ${g.scheduleText}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-bold">
              تأكيد النقل
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
