import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { studentsApi } from '../api';
import { StudentProgressDto, buildParentWhatsAppUrl } from '../types';
import { getApiErrorMessage } from '@/lib/api';
import { formatDateArabic } from '@/lib/date';
import {
  User,
  Phone,
  PhoneCall,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

interface StudentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const [progress, setProgress] = useState<StudentProgressDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId) {
      setProgress(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await studentsApi.getStudentProgress(studentId);
        if (!cancelled) setProgress(data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'تعذر تحميل ملف الطالب'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, studentId]);

  const whatsAppUrl = progress
    ? buildParentWhatsAppUrl(
        progress.parentPhoneNumber,
        `السلام عليكم ولي أمر الطالب/ة ${progress.name}،\nمتابعة من المنصة التعليمية:\n• الامتحانات/الواجبات المكتملة: ${progress.completedQuizzes} من ${progress.totalQuizzesAvailable}\n• المتبقي بدون حل: ${progress.pendingQuizzesCount}${
          progress.averageScorePercentage !== null && progress.averageScorePercentage !== undefined
            ? `\n• متوسط الدرجات: ${progress.averageScorePercentage}%`
            : ''
        }`
      )
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <span>ملف متابعة الطالب{progress ? `: ${progress.name}` : ''}</span>
        </div>
      }
      description={progress ? progress.email : undefined}
    >
      <div className="max-h-[75vh] overflow-y-auto space-y-5 pe-1 text-start">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-danger/30 bg-danger-bg text-danger flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : progress ? (
          <>
            {/* Personal & Contact Card */}
            <div className="rounded-xl border border-border bg-surface-subtle p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-text-main font-heading">
                    {progress.name}
                  </span>
                  {progress.gender && (
                    <Badge variant="neutral" size="sm">
                      {progress.gender === 'Male' ? 'طالب (ذكر)' : 'طالبة (أنثى)'}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>هاتف الطالب:</span>
                    <span dir="ltr" className="font-mono font-semibold text-text-main">
                      {progress.phoneNumber || '—'}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-secondary" />
                    <span>ولي الأمر:</span>
                    <span dir="ltr" className="font-mono font-semibold text-text-main">
                      {progress.parentPhoneNumber || '—'}
                    </span>
                  </span>

                  {progress.dateOfBirth && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-text-subtle" />
                      <span>الميلاد:</span>
                      <span dir="ltr" className="font-mono">
                        {progress.dateOfBirth}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    startIcon={<MessageCircle className="w-4 h-4" />}
                  >
                    مراسلة ولي الأمر واتساب
                  </Button>
                </a>
              )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-surface">
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم حله</span>
                </p>
                <p className="text-xl font-black text-text-main font-heading mt-1">
                  {progress.completedQuizzes}{' '}
                  <span className="text-xs font-normal text-text-muted">
                    / {progress.totalQuizzesAvailable}
                  </span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface">
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  <span>لم يُحل بعد</span>
                </p>
                <p className="text-xl font-black text-text-main font-heading mt-1">
                  {progress.pendingQuizzesCount}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface">
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>متوسط الدرجات</span>
                </p>
                <p className="text-xl font-black text-text-main font-heading mt-1">
                  {progress.averageScorePercentage !== null &&
                  progress.averageScorePercentage !== undefined
                    ? `${progress.averageScorePercentage}%`
                    : '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface">
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-secondary" />
                  <span>المحاضرات المشاهَدة</span>
                </p>
                <p className="text-xl font-black text-text-main font-heading mt-1">
                  {progress.completedLessonsCount}{' '}
                  <span className="text-xs font-normal text-text-muted">
                    / {progress.totalLessonsAvailable}
                  </span>
                </p>
              </div>
            </div>

            {/* Groups */}
            <div>
              <h4 className="text-sm font-bold text-text-main mb-2">المجموعات المشترك بها</h4>
              {progress.groups.length === 0 ? (
                <p className="text-xs text-text-muted bg-surface-subtle p-3 rounded-lg border border-border">
                  غير مسجل في أي مجموعة حالياً.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {progress.groups.map((g) => (
                    <div
                      key={g.groupId}
                      className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-bold text-text-main">{g.subjectTitle}</p>
                        <p className="text-xs text-text-muted">{g.groupName}</p>
                      </div>
                      <span className="text-[11px] text-text-subtle">
                        {formatDateArabic(g.joinedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Quizzes / Homework */}
            <div>
              <h4 className="text-sm font-bold text-text-main mb-2">
                الامتحانات والواجبات المحلولة ({progress.completedSubmissions.length})
              </h4>
              {progress.completedSubmissions.length === 0 ? (
                <p className="text-xs text-text-muted bg-surface-subtle p-3 rounded-lg border border-border">
                  لم يقم الطالب بتسليم أي واجب أو امتحان حتى الآن.
                </p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-surface-subtle text-text-muted border-b border-border">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-start">الاختبار / الواجب</th>
                        <th className="py-2 px-3 font-semibold text-start">المادة</th>
                        <th className="py-2 px-3 font-semibold text-start">الدرجة</th>
                        <th className="py-2 px-3 font-semibold text-start">تاريخ التسليم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {progress.completedSubmissions.map((sub, idx) => (
                        <tr key={`${sub.quizId}-${idx}`}>
                          <td className="py-2.5 px-3 font-bold text-text-main">{sub.quizTitle}</td>
                          <td className="py-2.5 px-3 text-text-muted">{sub.subjectTitle}</td>
                          <td className="py-2.5 px-3">
                            {sub.score !== null && sub.score !== undefined ? (
                              <Badge variant="success" size="sm">
                                {sub.score} / {sub.totalScore}
                                {sub.percentage !== null && sub.percentage !== undefined
                                  ? ` (${sub.percentage}%)`
                                  : ''}
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">بانتظار التصحيح</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted">
                            {formatDateArabic(sub.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Quizzes */}
            {progress.pendingQuizzes.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-text-main mb-2">
                  اختبارات / واجبات لم تُحل بعد ({progress.pendingQuizzes.length})
                </h4>
                <div className="space-y-1.5">
                  {progress.pendingQuizzes.map((q) => (
                    <div
                      key={q.quizId}
                      className="p-2.5 rounded-lg border border-warning/30 bg-warning-bg/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-text-main">{q.quizTitle}</span>
                      <span className="text-text-muted">{q.subjectTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        <div className="pt-2 border-t border-border-subtle flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
