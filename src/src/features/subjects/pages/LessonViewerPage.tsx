import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useLessonDetailQuery,
  useSubjectDetailQuery,
  useCompleteLessonMutation,
} from '../useSubjects';
import { LessonEmbedPlayer } from '../components/LessonEmbedPlayer';
import { LessonSummary, normalizeContentType, CONTENT_TYPE_LABELS } from '../types';
import { quizzesApi } from '@/features/quizzes/api';
import {
  QuizSummaryItemDto,
  normalizeAssessmentType,
  normalizeAssessmentPlacement,
} from '@/features/quizzes/types';
import { useAuth } from '@/features/auth/useAuth';
import { tenantPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';
import { formatDateArabic } from '@/lib/date';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  Lock,
  Eye,
  PlayCircle,
  FileText,
  FileCheck2,
  ClipboardList,
  Clock,
  Award,
  FolderOpen,
} from 'lucide-react';

type LectureTab = 'overview' | 'handout' | 'homework' | 'exam';

export const LessonViewerPage: React.FC = () => {
  const { subjectId, lessonId } = useParams<{ subjectId: string; lessonId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<LectureTab>('overview');
  const [quizzes, setQuizzes] = useState<QuizSummaryItemDto[]>([]);

  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError,
    refetch: refetchLesson,
  } = useLessonDetailQuery(lessonId);

  const {
    data: subject,
    isLoading: isSubjectLoading,
  } = useSubjectDetailQuery(subjectId);

  const completeMutation = useCompleteLessonMutation(subjectId);

  useEffect(() => {
    setActiveTab('overview');
  }, [lessonId]);

  useEffect(() => {
    if (!subjectId || !isAuthenticated) {
      setQuizzes([]);
      return;
    }
    let cancelled = false;
    quizzesApi
      .getSubjectQuizzes(subjectId)
      .then((data) => {
        if (!cancelled) setQuizzes(data);
      })
      .catch(() => {
        if (!cancelled) setQuizzes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, isAuthenticated]);

  const isLoading = isLessonLoading || isSubjectLoading;
  const isStudent = user?.role === 'Student';

  const lessons = subject?.lessons || [];
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const lessonQuizzes = useMemo(
    () => quizzes.filter((q) => q.lessonId === lesson?.id),
    [quizzes, lesson?.id]
  );
  const lessonHomeworks = lessonQuizzes.filter((q) => normalizeAssessmentType(q.type) === 'Homework');
  const lessonExams = lessonQuizzes.filter((q) => normalizeAssessmentType(q.type) === 'Exam');

  const moduleGroups = useMemo(() => {
    const hasModules = lessons.some((l) => l.moduleTitle && l.moduleTitle.trim().length > 0);
    if (!hasModules) {
      return [{ title: null as string | null, items: lessons.map((l, idx) => ({ lesson: l, idx })) }];
    }
    const groups: { title: string; items: { lesson: LessonSummary; idx: number }[] }[] = [];
    lessons.forEach((l, idx) => {
      const title = l.moduleTitle?.trim() || 'دروس عامة';
      const existing = groups.find((g) => g.title === title);
      if (existing) {
        existing.items.push({ lesson: l, idx });
      } else {
        groups.push({ title, items: [{ lesson: l, idx }] });
      }
    });
    return groups;
  }, [lessons]);

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const handleMarkCompleted = async () => {
    if (!lesson) return;
    try {
      await completeMutation.mutateAsync(lesson.id);
      success('أحسنت! تم تسجيل إتمام المحاضرة وفتح ما يليها.');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'تعذر تسجيل إتمام المحاضرة'));
    }
  };

  const tabs: Array<{ id: LectureTab; label: string; count?: number; icon: React.ReactNode }> = [
    { id: 'overview', label: 'الشرح والملخص', icon: <FileText className="w-4 h-4" /> },
    {
      id: 'handout',
      label: 'الملزمة PDF',
      count: lesson?.attachmentUrl ? 1 : 0,
      icon: <Paperclip className="w-4 h-4" />,
    },
    {
      id: 'homework',
      label: 'الواجب',
      count: lessonHomeworks.length,
      icon: <FileCheck2 className="w-4 h-4" />,
    },
    {
      id: 'exam',
      label: 'الامتحان',
      count: lessonExams.length,
      icon: <ClipboardList className="w-4 h-4" />,
    },
  ];

  const rootCrumb = isStudent
    ? { label: 'موادي', href: tenantPath('/my-subjects') }
    : { label: 'المواد', href: tenantPath('/subjects') };

  return (
    <PageLayout
      isLoading={isLoading}
      error={lessonError ? getApiErrorMessage(lessonError) : null}
      onRetry={refetchLesson}
      breadcrumbs={
        <Breadcrumbs
          items={[
            rootCrumb,
            ...(subject
              ? [{ label: subject.title, href: tenantPath(`/subjects/${subject.id}`) }]
              : []),
            { label: lesson?.title || 'غرفة المحاضرة' },
          ]}
        />
      }
      actions={
        subjectId ? (
          <Link to={tenantPath(`/subjects/${subjectId}`)}>
            <Button variant="secondary" size="sm" startIcon={<BookOpen className="w-4 h-4" />}>
              صفحة المادة الكاملة
            </Button>
          </Link>
        ) : null
      }
    >
      {lesson && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-start">
          {/* Main Column: Video Player + Lecture Pack Tabs */}
          <div className="lg:col-span-8 space-y-5 min-w-0">
            {/* Compact Lesson Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    المحاضرة {currentIndex >= 0 ? currentIndex + 1 : lesson.sortOrder} من {lessons.length || 1}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {CONTENT_TYPE_LABELS[normalizeContentType(lesson.contentType)]}
                  </Badge>
                  {lesson.moduleTitle && (
                    <Badge variant="neutral" size="sm">
                      {lesson.moduleTitle}
                    </Badge>
                  )}
                  {isStudent && lesson.viewCount !== undefined && lesson.viewCount > 0 && (
                    <Badge variant="neutral" size="sm" className="gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lesson.viewCount} مشاهدة</span>
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-text-main leading-snug">
                  {lesson.title}
                </h1>
              </div>

              {isStudent && (
                <div className="shrink-0">
                  {lesson.isCompleted ? (
                    <Badge variant="success" size="md" className="py-2 px-3.5 gap-1.5 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم إتمام المحاضرة</span>
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={completeMutation.isPending}
                      onClick={handleMarkCompleted}
                      startIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="font-bold w-full sm:w-auto"
                    >
                      تحديد كمكتملة
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Embedded Player */}
            <LessonEmbedPlayer lesson={lesson} />

            {/* Lecture Pack Tabs Card (Explanation, PDF Handout, Homework, Exam) */}
            <Card className="border-border overflow-hidden">
              <div className="flex items-center border-b border-border bg-surface-subtle px-2 sm:px-4 pt-2 overflow-x-auto gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 px-3 sm:px-4 pb-3 pt-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-text-muted hover:text-text-main'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-surface text-text-muted border border-border'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Tab 1: Overview & Lecture Checklist */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-sm font-bold text-text-main mb-1.5">عن هذه المحاضرة</h2>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {lesson.description || 'شاهد الشرح بعناية ثم راجع الملزمة المرفقة وابدأ في حل الواجب والامتحان التقييمي.'}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-border-subtle">
                      <h3 className="text-xs font-bold text-text-muted">مكونات ومهام المحاضرة</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-border bg-bg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-bold text-text-main">1. شرح المحاضرة</span>
                          </div>
                          <Badge variant={lesson.isCompleted ? 'success' : 'neutral'} size="sm">
                            {lesson.isCompleted ? 'مكتمل ✓' : 'متاح'}
                          </Badge>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('handout')}
                          className="p-3 rounded-xl border border-border bg-bg hover:border-primary/40 flex items-center justify-between gap-2 text-start transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Paperclip className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-bold text-text-main">2. ملزمة الحصة PDF</span>
                          </div>
                          <Badge variant={lesson.attachmentUrl ? 'info' : 'neutral'} size="sm">
                            {lesson.attachmentUrl ? 'مرفقة' : 'غير مرفقة'}
                          </Badge>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('homework')}
                          className="p-3 rounded-xl border border-border bg-bg hover:border-primary/40 flex items-center justify-between gap-2 text-start transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileCheck2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-bold text-text-main">3. واجب المحاضرة</span>
                          </div>
                          <Badge
                            variant={
                              lessonHomeworks.some((h) => h.mySubmission)
                                ? 'success'
                                : lessonHomeworks.length > 0
                                  ? 'info'
                                  : 'neutral'
                            }
                            size="sm"
                          >
                            {lessonHomeworks.some((h) => h.mySubmission)
                              ? 'تم الحل ✓'
                              : lessonHomeworks.length > 0
                                ? `${lessonHomeworks.length} متاح`
                                : 'لا يوجد'}
                          </Badge>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('exam')}
                          className="p-3 rounded-xl border border-border bg-bg hover:border-primary/40 flex items-center justify-between gap-2 text-start transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-bold text-text-main">4. امتحان التقييم</span>
                          </div>
                          <Badge
                            variant={
                              lessonExams.some((e) => e.mySubmission)
                                ? 'success'
                                : lessonExams.length > 0
                                  ? 'primary'
                                  : 'neutral'
                            }
                            size="sm"
                          >
                            {lessonExams.some((e) => e.mySubmission)
                              ? 'تم الاجتياز ✓'
                              : lessonExams.length > 0
                                ? `${lessonExams.length} متاح`
                                : 'لا يوجد'}
                          </Badge>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: PDF Handout */}
                {activeTab === 'handout' && (
                  lesson.attachmentUrl ? (
                    <div className="p-4 rounded-xl border border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                          <Paperclip className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main">ملزمة وملف الحصة المرفق</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            اضغط لفتح أو تحميل مذكرة الشرح وأسئلة التدريب بصيغة PDF
                          </p>
                        </div>
                      </div>
                      <a href={lesson.attachmentUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="font-bold w-full sm:w-auto"
                          endIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          فتح الملزمة (PDF)
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted text-center py-6">
                      لا توجد ملزمة PDF مرفقة مع هذه المحاضرة حالياً.
                    </p>
                  )
                )}

                {/* Tab 3: Linked Homework */}
                {activeTab === 'homework' && (
                  lessonHomeworks.length > 0 ? (
                    <div className="space-y-3">
                      {lessonHomeworks.map((hw) => {
                        const sub = hw.mySubmission;
                        const placementVal = normalizeAssessmentPlacement(hw.placement);
                        const nowMs = Date.now();
                        const notOpenYet = !sub && !!hw.availableFrom && new Date(hw.availableFrom).getTime() > nowMs;
                        const deadlinePassed = !sub && !!hw.dueAt && new Date(hw.dueAt).getTime() < nowMs;
                        return (
                          <div
                            key={hw.id}
                            className="p-4 rounded-xl border border-border bg-bg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="info" size="sm">واجب المحاضرة</Badge>
                                <Badge variant={placementVal === 'BeforeLesson' ? 'warning' : 'neutral'} size="sm">
                                  {placementVal === 'BeforeLesson' ? 'قبل المحاضرة' : 'بعد المحاضرة'}
                                </Badge>
                                {sub && (
                                  <Badge variant={sub.passed ? 'success' : 'warning'} size="sm" className="gap-1">
                                    <Award className="w-3 h-3" />
                                    <span>{sub.score} / {sub.totalScore} ({sub.percentage}%)</span>
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-text-main">{hw.title}</h3>
                              <p className="text-xs text-text-muted">
                                {hw.questionsCount} سؤال • الدرجة النهائية: {hw.totalScore} • نسبة النجاح: {hw.passingScorePercent}%
                              </p>
                              {(hw.availableFrom || hw.dueAt) && (
                                <p className="text-[11px] text-text-muted flex flex-wrap items-center gap-2">
                                  {hw.availableFrom && notOpenYet && (
                                    <span className="text-primary font-semibold">يفتح في: {formatDateArabic(hw.availableFrom)}</span>
                                  )}
                                  {hw.dueAt && (
                                    <span className={deadlinePassed ? 'text-danger font-bold' : 'text-warning font-semibold'}>
                                      {deadlinePassed ? 'انتهى الموعد النهائي' : `الديدلاين: ${formatDateArabic(hw.dueAt)}`}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            {notOpenYet || deadlinePassed ? (
                              <Button variant="outline" size="sm" disabled className="font-bold w-full sm:w-auto shrink-0">
                                {notOpenYet ? 'مجدول لاحقاً' : 'انتهى الموعد'}
                              </Button>
                            ) : (
                              <Link to={tenantPath(`/subjects/${subjectId}/quizzes/${hw.id}`)} className="shrink-0">
                                <Button
                                  variant={sub ? 'outline' : 'primary'}
                                  size="sm"
                                  className="font-bold w-full sm:w-auto"
                                >
                                  {sub ? 'مراجعة الإجابات' : 'ابدأ حل الواجب'}
                                </Button>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted text-center py-6">
                      لا يوجد واجب مرتبط بهذه المحاضرة.
                    </p>
                  )
                )}

                {/* Tab 4: Linked Exam */}
                {activeTab === 'exam' && (
                  lessonExams.length > 0 ? (
                    <div className="space-y-3">
                      {lessonExams.map((ex) => {
                        const sub = ex.mySubmission;
                        const placementVal = normalizeAssessmentPlacement(ex.placement);
                        const nowMs = Date.now();
                        const notOpenYet = !sub && !!ex.availableFrom && new Date(ex.availableFrom).getTime() > nowMs;
                        const deadlinePassed = !sub && !!ex.dueAt && new Date(ex.dueAt).getTime() < nowMs;
                        return (
                          <div
                            key={ex.id}
                            className="p-4 rounded-xl border border-border bg-bg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="primary" size="sm">امتحان إلكتروني</Badge>
                                <Badge variant={placementVal === 'BeforeLesson' ? 'warning' : 'neutral'} size="sm">
                                  {placementVal === 'BeforeLesson' ? 'قبل المحاضرة' : 'بعد المحاضرة'}
                                </Badge>
                                {ex.durationMinutes && (
                                  <Badge variant="neutral" size="sm" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{ex.durationMinutes} دقيقة</span>
                                  </Badge>
                                )}
                                {sub && (
                                  <Badge variant={sub.passed ? 'success' : 'warning'} size="sm" className="gap-1">
                                    <Award className="w-3 h-3" />
                                    <span>{sub.score} / {sub.totalScore} ({sub.percentage}%)</span>
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-text-main">{ex.title}</h3>
                              <p className="text-xs text-text-muted">
                                {ex.questionsCount} سؤال • {ex.totalScore} درجة • شرط النجاح: {ex.passingScorePercent}%
                              </p>
                              {(ex.availableFrom || ex.dueAt) && (
                                <p className="text-[11px] text-text-muted flex flex-wrap items-center gap-2">
                                  {ex.availableFrom && notOpenYet && (
                                    <span className="text-primary font-semibold">يفتح في: {formatDateArabic(ex.availableFrom)}</span>
                                  )}
                                  {ex.dueAt && (
                                    <span className={deadlinePassed ? 'text-danger font-bold' : 'text-warning font-semibold'}>
                                      {deadlinePassed ? 'انتهى الموعد النهائي' : `الديدلاين: ${formatDateArabic(ex.dueAt)}`}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            {notOpenYet || deadlinePassed ? (
                              <Button variant="outline" size="sm" disabled className="font-bold w-full sm:w-auto shrink-0">
                                {notOpenYet ? 'مجدول لاحقاً' : 'انتهى الموعد'}
                              </Button>
                            ) : (
                              <Link to={tenantPath(`/subjects/${subjectId}/quizzes/${ex.id}`)} className="shrink-0">
                                <Button
                                  variant={sub ? 'outline' : 'primary'}
                                  size="sm"
                                  className="font-bold w-full sm:w-auto"
                                >
                                  {sub ? 'مراجعة النتيجة' : 'ابدأ الامتحان الآن'}
                                </Button>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted text-center py-6">
                      لا يوجد امتحان مرتبط بهذه المحاضرة.
                    </p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Bottom Next / Previous Navigation Bar */}
            <Card className="border-border">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto text-start">
                  {prevLesson ? (
                    <Link
                      to={tenantPath(`/subjects/${subjectId}/lessons/${prevLesson.id}`)}
                      className="flex flex-col items-start gap-1 p-2 rounded-xl hover:bg-surface-hover transition-colors group"
                    >
                      <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
                        <span>المحاضرة السابقة</span>
                      </span>
                      <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">
                        {prevLesson.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="text-xs text-text-subtle p-2">
                      أنت في بداية المادة
                    </div>
                  )}
                </div>

                {subjectId && (
                  <Link to={tenantPath(`/subjects/${subjectId}`)}>
                    <Button variant="outline" size="sm" className="hidden md:inline-flex" startIcon={<BookOpen className="w-3.5 h-3.5" />}>
                      فهرس المادة ({lessons.length})
                    </Button>
                  </Link>
                )}

                <div className="w-full sm:w-auto text-end">
                  {nextLesson ? (
                    nextLesson.isLocked ? (
                      <div className="flex flex-col items-end gap-1 p-2 text-text-muted">
                        <span className="text-xs flex items-center gap-1.5 font-medium text-warning">
                          <Lock className="w-3.5 h-3.5" />
                          <span>المحاضرة التالية مقفلة</span>
                        </span>
                        <span className="text-xs line-clamp-1">
                          {nextLesson.title}
                        </span>
                      </div>
                    ) : (
                      <Link
                        to={tenantPath(`/subjects/${subjectId}/lessons/${nextLesson.id}`)}
                        className="flex flex-col items-end gap-1 p-2 rounded-xl hover:bg-surface-hover transition-colors group"
                      >
                        <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                          <span>المحاضرة التالية</span>
                          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0" />
                        </span>
                        <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">
                          {nextLesson.title}
                        </span>
                      </Link>
                    )
                  ) : (
                    <div className="text-xs text-success font-medium p-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>لقد وصلت إلى نهاية المادة!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Outline Sidebar */}
          {subject && (
            <aside className="lg:col-span-4 lg:sticky lg:top-20">
              <Card className="border-border overflow-hidden">
                <div className="p-4 bg-surface-subtle border-b border-border space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold font-heading text-text-main line-clamp-1">
                      محتوى المنهج
                    </h2>
                    <span className="text-xs font-bold text-primary shrink-0">
                      {completedCount} / {lessons.length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden border border-border-subtle">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
                  {moduleGroups.map((group, gIdx) => (
                    <div key={`${group.title ?? 'all'}-${gIdx}`} className="space-y-1.5">
                      {group.title && (
                        <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold text-text-muted">
                          <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{group.title}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {group.items.map(({ lesson: item, idx }) => {
                          const isCurrent = item.id === lesson.id;
                          const itemLocked = !!item.isLocked;

                          if (itemLocked) {
                            return (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl border border-border-subtle bg-surface-subtle/60 flex items-center justify-between gap-2 opacity-75"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Lock className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                                  <span className="text-xs text-text-muted line-clamp-1">
                                    {idx + 1}. {item.title}
                                  </span>
                                </div>
                                {item.price && item.price > 0 && (
                                  <Badge variant="warning" size="sm">
                                    {item.price} ج.م
                                  </Badge>
                                )}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={item.id}
                              to={tenantPath(`/subjects/${subjectId}/lessons/${item.id}`)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                                isCurrent
                                  ? 'border-primary bg-primary-subtle/60 text-primary font-bold'
                                  : 'border-border-subtle bg-surface hover:border-primary/40 hover:bg-surface-hover text-text-main'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <PlayCircle
                                    className={`w-4 h-4 shrink-0 ${
                                      isCurrent ? 'text-primary' : 'text-text-muted'
                                    }`}
                                  />
                                )}
                                <span className="text-xs line-clamp-2 leading-snug">
                                  {idx + 1}. {item.title}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          )}
        </div>
      )}
    </PageLayout>
  );
};
