import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSubjectDetailQuery } from '@/features/subjects/useSubjects';
import { PageLayout } from '@/components/ui/PageLayout';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { platformPath } from '@/lib/tenant';
import { getApiErrorMessage } from '@/lib/api';
import { formatDateArabic } from '@/lib/date';
import { quizzesApi } from '../api';
import {
  AssessmentPlacement,
  AssessmentType,
  QuizQuestionDto,
  QuizSummaryItemDto,
  normalizeAssessmentPlacement,
  normalizeAssessmentType,
} from '../types';
import {
  ClipboardList,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  Users,
  CalendarClock,
  Lock,
} from 'lucide-react';

interface DraftQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

const createEmptyQuestion = (index: number): DraftQuestion => ({
  id: `q-${Date.now()}-${index}`,
  prompt: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  points: 1,
});

export const SubjectQuizzesPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: subject } = useSubjectDetailQuery(subjectId);
  const { success, error: toastError } = useToast();

  const [quizzes, setQuizzes] = useState<QuizSummaryItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssessmentType>('Homework');
  const [lessonId, setLessonId] = useState<string>('');
  const [placement, setPlacement] = useState<AssessmentPlacement>('AfterLesson');
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [dueAt, setDueAt] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('30');
  const [passingScorePercent, setPassingScorePercent] = useState<string>('50');
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<DraftQuestion[]>([createEmptyQuestion(1)]);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill lessonId / open modal when launched from a lesson row (?lessonId=...&new=1)
  useEffect(() => {
    const paramLessonId = searchParams.get('lessonId');
    const shouldOpenNew = searchParams.get('new') === '1';
    if (paramLessonId) {
      setLessonId(paramLessonId);
      setPlacement('AfterLesson');
    }
    if (shouldOpenNew) {
      setIsCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Delete state
  const [quizToDelete, setQuizToDelete] = useState<QuizSummaryItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadQuizzes = async () => {
    if (!subjectId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await quizzesApi.getSubjectQuizzes(subjectId);
      setQuizzes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر تحميل الواجبات والامتحانات'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuizzes();
  }, [subjectId]);

  const resetForm = () => {
    setTitle('');
    setType('Homework');
    setLessonId('');
    setPlacement('AfterLesson');
    setAvailableFrom('');
    setDueAt('');
    setDurationMinutes('30');
    setPassingScorePercent('50');
    setIsPublished(true);
    setQuestions([createEmptyQuestion(1)]);
  };

  const handleQuestionChange = (idx: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOpts = [...q.options];
        nextOpts[optIdx] = val;
        return { ...q, options: nextOpts };
      })
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    const preparedQuestions: QuizQuestionDto[] = questions.map((q) => ({
      id: q.id,
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()).filter((o) => o.length > 0),
      correctOptionIndex: q.correctOptionIndex,
      points: Number(q.points) > 0 ? Number(q.points) : 1,
    }));

    for (let i = 0; i < preparedQuestions.length; i++) {
      if (preparedQuestions[i].prompt.length < 2) {
        toastError(`يرجى كتابة نص السؤال رقم ${i + 1}.`);
        return;
      }
      if (preparedQuestions[i].options.length < 2) {
        toastError(`السؤال رقم ${i + 1} يجب أن يحتوي على خيارين على الأقل.`);
        return;
      }
      if (
        preparedQuestions[i].correctOptionIndex === null ||
        preparedQuestions[i].correctOptionIndex === undefined ||
        preparedQuestions[i].correctOptionIndex! >= preparedQuestions[i].options.length
      ) {
        toastError(`حدد الإجابة الصحيحة للسؤال رقم ${i + 1} من الخيارات المكتوبة.`);
        return;
      }
    }

    if (availableFrom && dueAt && new Date(dueAt).getTime() <= new Date(availableFrom).getTime()) {
      toastError('الموعد النهائي (الديدلاين) يجب أن يكون بعد موعد الفتح.');
      return;
    }

    try {
      setIsSaving(true);
      const resolvedPlacement: AssessmentPlacement = lessonId ? placement : 'General';
      const created = await quizzesApi.createQuiz(subjectId, {
        title: title.trim(),
        type,
        lessonId: lessonId || null,
        placement: resolvedPlacement,
        availableFrom: availableFrom ? new Date(availableFrom).toISOString() : null,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        durationMinutes: type === 'Exam' && Number(durationMinutes) > 0 ? Number(durationMinutes) : null,
        passingScorePercent: Math.min(100, Math.max(0, Number(passingScorePercent) || 50)),
        isPublished,
        questions: preparedQuestions,
      });
      setQuizzes((prev) => [created, ...prev]);
      success(`تم إنشاء «${created.title}» بنجاح!`);
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حفظ الواجب أو الامتحان'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quizToDelete) return;
    try {
      setIsDeleting(true);
      await quizzesApi.deleteQuiz(quizToDelete.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      success('تم حذف التقييم بنجاح.');
      setQuizToDelete(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حذف التقييم'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      title={`الواجبات والامتحانات${subject ? `: ${subject.title}` : ''}`}
      description="أنشئ واجبات الحصص والامتحانات المؤقتة (MCQ) مع تصحيح آلي فوري ورصد تلقائي في ملف الطالب."
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'المواد الدراسية', href: platformPath('/dashboard/teacher/subjects') },
            ...(subject
              ? [{ label: subject.title, href: platformPath(`/dashboard/teacher/subjects/${subject.id}`) }]
              : []),
            { label: 'الواجبات والامتحانات' },
          ]}
        />
      }
      actions={
        <Button
          variant="primary"
          size="sm"
          className="font-bold"
          startIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          إنشاء واجب / امتحان
        </Button>
      }
      isLoading={isLoading}
      skeleton={
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      }
      error={error}
      onRetry={loadQuizzes}
    >
      <div className="space-y-4 text-start">
        {quizzes.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-10 h-10 text-text-muted" />}
            title="لا توجد واجبات أو امتحانات بعد"
            description="أضف أول واجب منزلي أو امتحان إلكتروني لهذه المادة وسيظهر للطلاب فوراً مع التصحيح التلقائي."
            action={
              <Button
                variant="primary"
                startIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateOpen(true)}
              >
                إنشاء واجب / امتحان الآن
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => {
              const kind = normalizeAssessmentType(quiz.type);
              const placementVal = normalizeAssessmentPlacement(quiz.placement);
              const isBeforeLesson = placementVal === 'BeforeLesson';
              return (
                <Card key={quiz.id} className="border-border">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <Badge variant={kind === 'Exam' ? 'primary' : 'info'} size="sm">
                            {kind === 'Exam' ? 'امتحان' : 'واجب'}
                          </Badge>
                          <Badge variant={quiz.isPublished ? 'success' : 'warning'} size="sm">
                            {quiz.isPublished ? 'منشور' : 'مسودة'}
                          </Badge>
                          {quiz.lessonId && (
                            <Badge variant={isBeforeLesson ? 'warning' : 'neutral'} size="sm" className="gap-1">
                              {isBeforeLesson && <Lock className="w-3 h-3" />}
                              <span>{isBeforeLesson ? 'قبل المحاضرة (شرط فتح)' : 'بعد المحاضرة'}</span>
                            </Badge>
                          )}
                          {quiz.durationMinutes && (
                            <Badge variant="neutral" size="sm" className="gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{quiz.durationMinutes} دقيقة</span>
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-text-main">{quiz.title}</h3>
                        {quiz.lessonTitle && (
                          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>مرتبط بـ: {quiz.lessonTitle}</span>
                          </p>
                        )}
                        {(quiz.availableFrom || quiz.dueAt) && (
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-text-muted">
                            {quiz.availableFrom && (
                              <span className="flex items-center gap-1">
                                <CalendarClock className="w-3 h-3 text-primary" />
                                <span>يفتح: {formatDateArabic(quiz.availableFrom)}</span>
                              </span>
                            )}
                            {quiz.dueAt && (
                              <span className="flex items-center gap-1 text-warning font-semibold">
                                <CalendarClock className="w-3 h-3" />
                                <span>الديدلاين: {formatDateArabic(quiz.dueAt)}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-bg"
                        onClick={() => setQuizToDelete(quiz)}
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-2 border-t border-border-subtle">
                      <span>{quiz.questionsCount} سؤال</span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <span>{quiz.totalScore} درجة (النجاح {quiz.passingScorePercent}%)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-secondary" />
                        <span>{quiz.submissionsCount} تسليم</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Quiz / Homework Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        size="lg"
        title="إنشاء واجب أو امتحان جديد (MCQ)"
        description="أضف الأسئلة وحدد الإجابة الصحيحة ليتم التصحيح آلياً عند تسليم الطالب."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pe-1 text-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="العنوان"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: امتحان الشهر الأول"
            />

            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">النوع</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'Homework', label: 'واجب منزلي' },
                    { value: 'Exam', label: 'امتحان بمؤقت' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      type === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {subject && (
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  ربط بمحاضرة (اختياري)
                </label>
                <select
                  value={lessonId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLessonId(val);
                    if (!val) setPlacement('General');
                    else if (placement === 'General') setPlacement('AfterLesson');
                  }}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">تقييم عام على المادة</option>
                  {subject.lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === 'Exam' && (
              <Input
                label="المدة بالدقائق"
                type="number"
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            )}

            <Input
              label="نسبة النجاح (%)"
              type="number"
              min={0}
              max={100}
              value={passingScorePercent}
              onChange={(e) => setPassingScorePercent(e.target.value)}
            />
          </div>

          {lessonId && (
            <div className="p-3 rounded-xl border border-border bg-surface-subtle space-y-2">
              <label className="block text-xs font-bold text-text-main">
                توقيت التقييم بالنسبة للمحاضرة:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: 'AfterLesson',
                      label: 'بعد المحاضرة',
                      hint: 'واجب أو تقييم يظهر داخل غرفة المحاضرة',
                    },
                    {
                      value: 'BeforeLesson',
                      label: 'قبل المحاضرة (شرط لفتحها)',
                      hint: 'لا تفتح المحاضرة للطالب إلا بعد حل هذا الكويز',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPlacement(opt.value)}
                    className={`p-2.5 rounded-lg border text-start transition-colors cursor-pointer ${
                      placement === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-text-muted hover:text-text-main'
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="block text-[11px] opacity-80 mt-0.5">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-main mb-1.5">
                موعد الفتح (اختياري)
              </label>
              <input
                type="datetime-local"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-main mb-1.5">
                الموعد النهائي / الديدلاين (اختياري)
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-border"
            />
            <span>نشر التقييم للطلاب مباشرة</span>
          </label>

          {/* Dynamic Questions Builder */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-text-main">الأسئلة ({questions.length})</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                startIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)])}
              >
                إضافة سؤال
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">سؤال #{qIdx + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-muted">الدرجة:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={q.points}
                      onChange={(e) =>
                        handleQuestionChange(qIdx, { points: Number(e.target.value) || 1 })
                      }
                      className="w-16 h-8 rounded border border-border bg-surface px-2 text-xs text-center"
                    />
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger px-2"
                        onClick={() =>
                          setQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <Input
                  placeholder="اكتب نص السؤال هنا..."
                  value={q.prompt}
                  onChange={(e) => handleQuestionChange(qIdx, { prompt: e.target.value })}
                />

                <div className="space-y-2">
                  <p className="text-[11px] text-text-muted">
                    اكتب الخيارات وحدد الدائرة بجانب الإجابة الصحيحة:
                  </p>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuestionChange(qIdx, { correctOptionIndex: optIdx })}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          q.correctOptionIndex === optIdx
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-border bg-surface text-text-subtle'
                        }`}
                        title="تحديد كإجابة صحيحة"
                      >
                        {q.correctOptionIndex === optIdx && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        type="text"
                        placeholder={`الخيار ${optIdx + 1}${optIdx >= 2 ? ' (اختياري)' : ''}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-border bg-surface px-3 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              حفظ ونشر
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="حذف التقييم"
        description={`هل أنت متأكد من حذف «${quizToDelete?.title}»؟ سيتم حذف جميع تسليمات الطلاب المرتبطة به.`}
        confirmText="نعم، حذف"
        variant="danger"
      />
    </PageLayout>
  );
};
