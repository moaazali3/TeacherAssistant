import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSubjectDetailQuery } from '../useSubjects';
import { useAuth } from '@/features/auth/useAuth';
import { LessonSummary, normalizeContentType, CONTENT_TYPE_LABELS } from '../types';
import { quizzesApi } from '@/features/quizzes/api';
import { QuizSummaryItemDto, normalizeAssessmentType } from '@/features/quizzes/types';
import { LessonCheckoutModal } from '@/features/payments/components/LessonCheckoutModal';
import { tenantPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getApiErrorMessage } from '@/lib/api';
import { formatDateArabic } from '@/lib/date';
import {
  PlayCircle,
  Lock,
  BookOpen,
  ArrowRight,
  Video,
  FileText,
  Link as LinkIcon,
  File,
  CheckCircle2,
  CalendarClock,
  Paperclip,
  FolderOpen,
  ClipboardList,
  Clock,
  Award,
  CreditCard,
  ChevronDown,
  FileCheck2,
  GraduationCap,
} from 'lucide-react';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { data: subject, isLoading, error, refetch } = useSubjectDetailQuery(subjectId);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<QuizSummaryItemDto[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [checkoutLesson, setCheckoutLesson] = useState<{
    id: string;
    title: string;
    price: number;
  } | null>(null);

  const isStudent = user?.role === 'Student';

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return <Video className="w-3.5 h-3.5" />;
      case 'Pdf':
      case 'Word':
      case 'Article':
        return <FileText className="w-3.5 h-3.5" />;
      case 'Link':
        return <LinkIcon className="w-3.5 h-3.5" />;
      default:
        return <File className="w-3.5 h-3.5" />;
    }
  };

  const quizzesByLessonId = useMemo(() => {
    const map = new Map<string, QuizSummaryItemDto[]>();
    quizzes.forEach((q) => {
      if (!q.lessonId) return;
      const list = map.get(q.lessonId) || [];
      list.push(q);
      map.set(q.lessonId, list);
    });
    return map;
  }, [quizzes]);

  const moduleGroups = useMemo(() => {
    const lessons = subject?.lessons || [];
    const hasModules = lessons.some((l) => l.moduleTitle && l.moduleTitle.trim().length > 0);
    if (!hasModules) {
      return [{ title: null as string | null, items: lessons.map((lesson, idx) => ({ lesson, idx })) }];
    }

    const groups: { title: string; items: { lesson: LessonSummary; idx: number }[] }[] = [];
    lessons.forEach((lesson, idx) => {
      const title = lesson.moduleTitle?.trim() || 'دروس عامة';
      const existing = groups.find((g) => g.title === title);
      if (existing) {
        existing.items.push({ lesson, idx });
      } else {
        groups.push({ title, items: [{ lesson, idx }] });
      }
    });
    return groups;
  }, [subject?.lessons]);

  const lessons = subject?.lessons || [];
  const completedLessons = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const completedQuizzes = quizzes.filter((q) => !!q.mySubmission).length;
  const firstUnlockedLesson = lessons.find((l) => !l.isLocked);
  const resumeLesson = lessons.find((l) => !l.isLocked && !l.isCompleted) || firstUnlockedLesson;

  const toggleModule = (key: string) => {
    setCollapsedModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const backHref = isStudent ? tenantPath('/my-subjects') : tenantPath('/subjects');
  const backLabel = isStudent ? 'موادي الدراسية' : 'جميع المواد';

  return (
    <PageLayout
      isLoading={isLoading}
      error={error ? getApiErrorMessage(error) : null}
      onRetry={refetch}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'الرئيسية', href: tenantPath('/') },
            { label: isStudent ? 'موادي' : 'المواد', href: backHref },
            { label: subject?.title || 'تفاصيل المادة' },
          ]}
        />
      }
      actions={
        <Link to={backHref}>
          <Button variant="secondary" size="sm" startIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
            {backLabel}
          </Button>
        </Link>
      }
    >
      {subject && (
        <div className="space-y-8 sm:space-y-10">
          {/* Subject Hero Banner */}
          <div className="relative rounded-2xl bg-gradient-to-b from-primary-subtle to-surface border border-border p-5 sm:p-8 shadow-xs text-start">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Prominent Subject Cover */}
              {subject.thumbnailUrl ? (
                <div className="w-full md:w-80 aspect-video rounded-2xl overflow-hidden border border-border shadow-sm shrink-0 bg-surface">
                  <img
                    src={subject.thumbnailUrl}
                    alt={subject.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full md:w-80 aspect-video rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold text-4xl shrink-0 font-heading border border-primary/20">
                  {subject.title.charAt(0)}
                </div>
              )}

              {/* Info + Progress + Smart CTA */}
              <div className="flex-1 space-y-3.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {subject.gradeLevel && (
                    <Badge variant="info" size="sm" className="gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{subject.gradeLevel}</span>
                    </Badge>
                  )}
                  <Badge variant="primary" size="sm">
                    {subject.instructorName ? `المعلم: ${subject.instructorName}` : 'مقرر تعليمي'}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {lessons.length} {lessons.length === 1 ? 'محاضرة' : 'محاضرات'}
                  </Badge>
                  {isAuthenticated && quizzes.length > 0 && (
                    <Badge variant="neutral" size="sm">
                      {quizzes.length} واجب وامتحان
                    </Badge>
                  )}
                  {!subject.isPublished && (
                    <Badge variant="warning" size="sm">
                      مسودة (مرئي لك كمعلم فقط)
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-text-main leading-tight">
                  {subject.title}
                </h1>

                <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                  {subject.description || 'لا يوجد وصف مضاف لهذا المقرر التعليمي حتى الآن.'}
                </p>

                {/* Student Progress Bar */}
                {isAuthenticated && isStudent && lessons.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <span className="text-text-main">
                        تقدمك في المنهج: {completedLessons} من {lessons.length} محاضرة ({progressPercent}%)
                      </span>
                      {quizzes.length > 0 && (
                        <span className="text-primary">
                          الواجبات والامتحانات المحلولة: {completedQuizzes} / {quizzes.length}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface-subtle overflow-hidden border border-border-subtle">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Smart Resume CTA */}
                {lessons.length > 0 && (
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    {isAuthenticated ? (
                      resumeLesson && (
                        <Link to={tenantPath(`/subjects/${subject.id}/lessons/${resumeLesson.id}`)}>
                          <Button variant="primary" size="md" className="font-bold" startIcon={<PlayCircle className="w-4 h-4" />}>
                            {completedLessons > 0 ? 'استكمل من حيث توقفت' : 'ابدأ المحاضرة الأولى'}
                          </Button>
                        </Link>
                      )
                    ) : (
                      <Link to={tenantPath('/login')} state={{ from: location }}>
                        <Button variant="primary" size="md" className="font-bold" startIcon={<Lock className="w-4 h-4" />}>
                          تسجيل الدخول لبدء المتابعة
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Curriculum Modules & Lecture Pack Cards */}
          <div className="space-y-5 text-start">
            <div className="pb-3 border-b border-border">
              <h2 className="text-xl font-bold font-heading text-text-main">
                محتويات وخطة المادة
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                كل محاضرة تضم الشرح والملازم والواجبات والامتحانات المرتبطة بها بالترتيب
              </p>
            </div>

            {lessons.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-10 h-10 text-text-muted" />}
                title="لا توجد دروس مضافة لهذا المادة بعد"
                description="لم يقم المعلم برفع محتويات هذا المقرر حتى الآن. تفقد الصفحة في وقت لاحق."
              />
            ) : (
              <div className="space-y-5">
                {moduleGroups.map((group, gIdx) => {
                  const moduleKey = group.title || `module-${gIdx}`;
                  const isCollapsed = !!collapsedModules[moduleKey];
                  const completedInGroup = group.items.filter((i) => i.lesson.isCompleted).length;

                  return (
                    <div key={moduleKey} className="space-y-3">
                      {group.title && (
                        <button
                          type="button"
                          onClick={() => toggleModule(moduleKey)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-subtle border border-border hover:border-primary/40 transition-colors cursor-pointer text-start"
                        >
                          <div className="flex items-center gap-2.5 font-bold text-text-main text-sm sm:text-base font-heading">
                            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                            <span>{group.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isAuthenticated && (
                              <Badge variant="neutral" size="sm">
                                {completedInGroup} / {group.items.length} مكتمل
                              </Badge>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                                isCollapsed ? '' : 'rotate-180'
                              }`}
                            />
                          </div>
                        </button>
                      )}

                      {!isCollapsed && (
                        <div className="space-y-3">
                          {group.items.map(({ lesson, idx }) => {
                            const normType = normalizeContentType(lesson.contentType);
                            const isLocked = !!lesson.isLocked;
                            const isPaymentLocked = isLocked && lesson.lockReason === 'payment_required';
                            const linkedQuizzes = quizzesByLessonId.get(lesson.id) || [];
                            const linkedHomeworks = linkedQuizzes.filter((q) => normalizeAssessmentType(q.type) === 'Homework');
                            const linkedExams = linkedQuizzes.filter((q) => normalizeAssessmentType(q.type) === 'Exam');

                            const scheduledLabel =
                              lesson.lockReason === 'scheduled' && lesson.availableAt
                                ? `يُفتح في ${formatDateArabic(lesson.availableAt)}`
                                : isPaymentLocked
                                  ? `محاضرة مدفوعة — افتحها الآن عبر فوري أو المحافظ أو البطاقة (${lesson.price} ج.م)`
                                  : lesson.lockReason;

                            return (
                              <Card
                                key={lesson.id}
                                className={`p-3.5 sm:p-4 transition-all border-border ${
                                  isLocked
                                    ? 'bg-surface-subtle/70 opacity-90'
                                    : 'hover:border-primary/40 hover:shadow-xs'
                                }`}
                              >
                                <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  {/* Visual Thumbnail Preview + Details */}
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-1 min-w-0">
                                    {/* Lecture Visual Box */}
                                    <div className="relative w-full sm:w-36 aspect-video rounded-xl overflow-hidden border border-border bg-primary-subtle shrink-0">
                                      {subject.thumbnailUrl ? (
                                        <img
                                          src={subject.thumbnailUrl}
                                          alt={lesson.title}
                                          className={`w-full h-full object-cover ${isLocked ? 'grayscale opacity-60' : ''}`}
                                        />
                                      ) : null}
                                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-slate-950/20 flex items-center justify-center">
                                        {lesson.isCompleted ? (
                                          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                            <CheckCircle2 className="w-5 h-5" />
                                          </div>
                                        ) : isLocked ? (
                                          <div className="w-9 h-9 rounded-full bg-slate-900/80 text-white border border-white/25 flex items-center justify-center shadow-sm">
                                            <Lock className="w-4 h-4" />
                                          </div>
                                        ) : (
                                          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                                            <PlayCircle className="w-5 h-5" />
                                          </div>
                                        )}
                                      </div>
                                      <span className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-md bg-slate-950/75 text-white text-[10px] font-bold">
                                        #{idx + 1}
                                      </span>
                                    </div>

                                    <div className="flex-1 min-w-0 text-start space-y-1.5">
                                      <h3 className="font-bold text-sm sm:text-base text-text-main leading-snug">
                                        {lesson.title}
                                      </h3>

                                      {isLocked && scheduledLabel ? (
                                        <p className="text-xs text-warning font-medium flex items-center gap-1.5">
                                          <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                                          <span>{scheduledLabel}</span>
                                        </p>
                                      ) : (
                                        lesson.description && (
                                          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                                            {lesson.description}
                                          </p>
                                        )
                                      )}

                                      {/* Lecture Pack Component Pills */}
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        <Badge variant="neutral" size="sm" className="gap-1">
                                          {getTypeIcon(normType)}
                                          <span>{CONTENT_TYPE_LABELS[normType]}</span>
                                        </Badge>

                                        {lesson.attachmentUrl && (
                                          <Badge variant="neutral" size="sm" className="gap-1">
                                            <Paperclip className="w-3 h-3 text-primary" />
                                            <span>ملزمة PDF</span>
                                          </Badge>
                                        )}

                                        {linkedHomeworks.map((hw) => (
                                          <Badge
                                            key={hw.id}
                                            variant={hw.mySubmission ? 'success' : 'info'}
                                            size="sm"
                                            className="gap-1"
                                          >
                                            <FileCheck2 className="w-3 h-3" />
                                            <span>
                                              {hw.mySubmission
                                                ? `واجب ✓ ${hw.mySubmission.percentage}%`
                                                : 'واجب متاح'}
                                            </span>
                                          </Badge>
                                        ))}

                                        {linkedExams.map((ex) => (
                                          <Badge
                                            key={ex.id}
                                            variant={ex.mySubmission ? 'success' : 'primary'}
                                            size="sm"
                                            className="gap-1"
                                          >
                                            <ClipboardList className="w-3 h-3" />
                                            <span>
                                              {ex.mySubmission
                                                ? `امتحان ✓ ${ex.mySubmission.percentage}%`
                                                : `امتحان${ex.durationMinutes ? ` (${ex.durationMinutes} د)` : ''}`}
                                            </span>
                                          </Badge>
                                        ))}

                                        {lesson.price !== undefined && lesson.price > 0 && (
                                          <Badge variant={lesson.isPurchased ? 'success' : 'warning'} size="sm">
                                            {lesson.isPurchased ? 'تم الشراء ✓' : `${lesson.price} ج.م`}
                                          </Badge>
                                        )}

                                        {!lesson.isPublished && (
                                          <Badge variant="warning" size="sm">
                                            مسودة
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 self-stretch sm:self-center">
                                    {isAuthenticated ? (
                                      isPaymentLocked ? (
                                        <Button
                                          type="button"
                                          variant="primary"
                                          size="sm"
                                          className="w-full sm:w-auto font-bold bg-amber-600 hover:bg-amber-700 text-white"
                                          startIcon={<CreditCard className="w-3.5 h-3.5" />}
                                          onClick={() =>
                                            setCheckoutLesson({
                                              id: lesson.id,
                                              title: lesson.title,
                                              price: lesson.price || 0,
                                            })
                                          }
                                        >
                                          شراء المحاضرة ({lesson.price} ج.م)
                                        </Button>
                                      ) : isLocked ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled
                                          className="w-full sm:w-auto text-xs"
                                          startIcon={<Lock className="w-3.5 h-3.5" />}
                                        >
                                          مقفل حالياً
                                        </Button>
                                      ) : (
                                        <Link to={tenantPath(`/subjects/${subject.id}/lessons/${lesson.id}`)} className="block">
                                          <Button
                                            variant={lesson.isCompleted ? 'outline' : 'primary'}
                                            size="sm"
                                            className="w-full sm:w-auto font-bold"
                                            startIcon={<PlayCircle className="w-3.5 h-3.5" />}
                                          >
                                            {lesson.isCompleted ? 'مراجعة المحاضرة' : 'فتح المحاضرة'}
                                          </Button>
                                        </Link>
                                      )
                                    ) : (
                                      <Link to={tenantPath('/login')} state={{ from: location }} className="block">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full sm:w-auto text-xs text-primary font-bold"
                                          startIcon={<Lock className="w-3.5 h-3.5" />}
                                        >
                                          سجل الدخول للمشاهدة
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Subject Homeworks & Exams Summary */}
          {isAuthenticated && quizzes.length > 0 && (
            <div className="space-y-4 text-start">
              <div className="pb-3 border-b border-border">
                <h2 className="text-xl font-bold font-heading text-text-main flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <span>كل الواجبات والامتحانات ({quizzes.length})</span>
                </h2>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                  حل الواجبات والامتحانات أونلاين واحصل على درجتك والتصحيح الفوري
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => {
                  const kind = normalizeAssessmentType(quiz.type);
                  const sub = quiz.mySubmission;
                  return (
                    <Card key={quiz.id} className="border-border">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={kind === 'Exam' ? 'primary' : 'info'} size="sm">
                              {kind === 'Exam' ? 'امتحان' : 'واجب'}
                            </Badge>
                            {quiz.durationMinutes && (
                              <Badge variant="neutral" size="sm" className="gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{quiz.durationMinutes} د</span>
                              </Badge>
                            )}
                            {sub && (
                              <Badge variant={sub.passed ? 'success' : 'warning'} size="sm" className="gap-1">
                                <Award className="w-3 h-3" />
                                <span>{sub.score} / {sub.totalScore} ({sub.percentage}%)</span>
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-text-main">{quiz.title}</h3>
                          <p className="text-xs text-text-muted line-clamp-1">
                            {quiz.questionsCount} سؤال • {quiz.totalScore} درجة
                            {quiz.lessonTitle ? ` • تابع لـ: ${quiz.lessonTitle}` : ''}
                          </p>
                        </div>

                        <Link to={tenantPath(`/subjects/${subject.id}/quizzes/${quiz.id}`)} className="shrink-0">
                          <Button
                            variant={sub ? 'outline' : 'primary'}
                            size="sm"
                            className="font-bold w-full sm:w-auto"
                          >
                            {sub ? 'مراجعة الإجابات' : 'ابدأ الحل'}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <LessonCheckoutModal
        isOpen={!!checkoutLesson}
        onClose={() => setCheckoutLesson(null)}
        lesson={checkoutLesson}
        onPurchased={() => {
          void refetch();
        }}
      />
    </PageLayout>
  );
};
