import React, { useState, useEffect } from 'react';
import { GroupDto, GroupMemberDto } from '../types';
import { groupsApi } from '../api';
import { MoveStudentModal } from './MoveStudentModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { StudentProgressModal } from '@/features/students/components/StudentProgressModal';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';
import { formatDateArabic } from '@/lib/date';
import { Users, Search, UserMinus, KeyRound, ArrowRightLeft, Calendar, Phone, PhoneCall, Eye } from 'lucide-react';

interface GroupStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDto | null;
  allGroups: GroupDto[];
  onStudentsCountChanged?: () => void;
}

export const GroupStudentsModal: React.FC<GroupStudentsModalProps> = ({
  isOpen,
  onClose,
  group,
  allGroups,
  onStudentsCountChanged,
}) => {
  const { success, error: toastError } = useToast();
  const [students, setStudents] = useState<GroupMemberDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-modals state
  const [selectedStudentForMove, setSelectedStudentForMove] = useState<GroupMemberDto | null>(null);
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<GroupMemberDto | null>(null);
  const [selectedStudentIdForProgress, setSelectedStudentIdForProgress] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<GroupMemberDto | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchStudents = async () => {
    if (!group) return;
    try {
      setIsLoading(true);
      const data = await groupsApi.getGroupStudents(group.id);
      setStudents(data);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل جلب قائمة الطلاب في المجموعة'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && group) {
      fetchStudents();
    } else {
      setStudents([]);
      setSearchQuery('');
    }
  }, [isOpen, group?.id]);

  if (!group) return null;

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;
    try {
      setIsRemoving(true);
      await groupsApi.removeStudent(group.id, studentToRemove.studentId);
      success(`تمت إزالة الطالب «${studentToRemove.name}» من المجموعة بنجاح.`);
      setStudents((prev) => prev.filter((s) => s.studentId !== studentToRemove.studentId));
      setStudentToRemove(null);
      onStudentsCountChanged?.();
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل إزالة الطالب من المجموعة'));
    } finally {
      setIsRemoving(false);
    }
  };

  const handleMoveStudentConfirm = async (studentId: string, targetGroupId: string) => {
    try {
      await groupsApi.moveStudent(group.id, studentId, targetGroupId);
      success('تم نقل الطالب بنجاح إلى المجموعة الجديدة.');
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
      onStudentsCountChanged?.();
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل نقل الطالب'));
      throw err;
    }
  };

  const handleResetPasswordConfirm = async (studentId: string, newPassword: string) => {
    try {
      await groupsApi.resetStudentPassword(studentId, { newPassword });
      success('تمت إعادة تعيين كلمة مرور الطالب بنجاح.');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل إعادة تعيين كلمة المرور'));
      throw err;
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phoneNumber && s.phoneNumber.includes(searchQuery)) ||
      (s.parentPhoneNumber && s.parentPhoneNumber.includes(searchQuery))
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>طلاب المجموعة: {group.name}</span>
          </div>
        }
        description={
          <span>
            كود الانضمام: <span className="font-mono font-bold text-primary">{group.joinCode}</span> • إجمالي الطلاب: {students.length}
          </span>
        }
      >
        <div className="flex flex-col max-h-[70vh]">
          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-main placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Search className="w-4 h-4 text-text-muted absolute start-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Modal Body / Table / Cards */}
          <div className="overflow-y-auto flex-1 pe-1">
            {isLoading ? (
              <div className="space-y-3 py-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10 text-text-muted" />}
                title={searchQuery ? 'لا توجد نتائج مطابقة' : 'لا يوجد طلاب في هذه المجموعة بعد'}
                description={
                  searchQuery
                    ? 'جرب البحث بكلمة أخرى أو مسح حقل البحث.'
                    : `شارك كود الانضمام (${group.joinCode}) مع طلابك ليتمكنوا من التسجيل والانضمام للمجموعة.`
                }
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-start text-sm">
                    <thead className="bg-surface-subtle text-text-muted text-xs border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold text-start">الطالب</th>
                        <th className="py-2.5 px-3.5 font-semibold text-start">البريد الإلكتروني</th>
                        <th className="py-2.5 px-3.5 font-semibold text-start">أرقام التواصل</th>
                        <th className="py-2.5 px-3.5 font-semibold text-start">تاريخ الانضمام</th>
                        <th className="py-2.5 px-3.5 font-semibold text-end">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredStudents.map((student) => (
                        <tr key={student.studentId} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-bold text-text-main">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-xs text-text-muted">
                            {student.email}
                          </td>
                          <td className="py-3 px-3.5 text-xs text-text-muted">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-primary shrink-0" />
                                <span dir="ltr" className="font-mono text-text-main">
                                  {student.phoneNumber || '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <PhoneCall className="w-3 h-3 text-text-subtle shrink-0" />
                                <span dir="ltr" className="font-mono text-text-muted">
                                  {student.parentPhoneNumber || '—'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-xs text-text-muted">
                            {formatDateArabic(student.joinedAt)}
                          </td>
                          <td className="py-3 px-3.5 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs px-2.5 py-1 text-primary"
                                onClick={() => setSelectedStudentIdForProgress(student.studentId)}
                                startIcon={<Eye className="w-3.5 h-3.5" />}
                                title="عرض ملف الطالب ودرجاته"
                              >
                                ملف الطالب
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs px-2.5 py-1"
                                onClick={() => setSelectedStudentForMove(student)}
                                startIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                                title="نقل إلى مجموعة أخرى"
                              >
                                نقل
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs px-2.5 py-1 text-warning hover:bg-warning-bg hover:border-warning/50"
                                onClick={() => setSelectedStudentForReset(student)}
                                startIcon={<KeyRound className="w-3.5 h-3.5" />}
                                title="إعادة تعيين كلمة المرور"
                              >
                                كلمة المرور
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs px-2.5 py-1 text-danger hover:bg-danger-bg"
                                onClick={() => setStudentToRemove(student)}
                                startIcon={<UserMinus className="w-3.5 h-3.5" />}
                                title="إزالة الطالب من المجموعة"
                              >
                                إزالة
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="sm:hidden space-y-3">
                  {filteredStudents.map((student) => (
                    <div key={student.studentId} className="p-3.5 rounded-xl border border-border bg-surface space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-text-main block">{student.name}</span>
                            <span className="text-xs font-mono text-text-muted">{student.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted pt-1 border-t border-border-subtle">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <span dir="ltr" className="font-mono text-text-main">
                            {student.phoneNumber || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-text-subtle" />
                          <span dir="ltr" className="font-mono">
                            {student.parentPhoneNumber || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-text-muted pt-1 border-t border-border-subtle">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>انضم {formatDateArabic(student.joinedAt)}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs px-1.5 text-primary"
                          onClick={() => setSelectedStudentIdForProgress(student.studentId)}
                        >
                          ملف الطالب
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs px-1.5"
                          onClick={() => setSelectedStudentForMove(student)}
                        >
                          نقل
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs px-1.5 text-warning"
                          onClick={() => setSelectedStudentForReset(student)}
                        >
                          كلمة السر
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs px-1.5 text-danger"
                          onClick={() => setStudentToRemove(student)}
                        >
                          إزالة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">
              {filteredStudents.length} طالب معروض
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move Student Sub-modal */}
      <MoveStudentModal
        isOpen={!!selectedStudentForMove}
        onClose={() => setSelectedStudentForMove(null)}
        student={selectedStudentForMove}
        currentGroupId={group.id}
        availableGroups={allGroups}
        onConfirmMove={handleMoveStudentConfirm}
      />

      {/* Reset Password Sub-modal */}
      <ResetPasswordModal
        isOpen={!!selectedStudentForReset}
        onClose={() => setSelectedStudentForReset(null)}
        student={selectedStudentForReset}
        onConfirmReset={handleResetPasswordConfirm}
      />

      <StudentProgressModal
        isOpen={!!selectedStudentIdForProgress}
        onClose={() => setSelectedStudentIdForProgress(null)}
        studentId={selectedStudentIdForProgress}
      />

      {/* Confirm Remove Student Dialog */}
      <ConfirmDialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="تأكيد إزالة الطالب"
        description={
          studentToRemove ? (
            <span>
              هل أنت متأكد من رغبتك في إزالة الطالب <strong className="text-text-main">«{studentToRemove.name}»</strong> من مجموعة «{group.name}»؟ لن يتم حذف حسابه، بل إزالته من هذه المجموعة فقط.
            </span>
          ) : ''
        }
        confirmText="إزالة الطالب"
        isLoading={isRemoving}
      />
    </>
  );
};
