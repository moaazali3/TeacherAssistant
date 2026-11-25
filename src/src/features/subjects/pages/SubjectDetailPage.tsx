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
} from 'lucide-react';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { data: subject, isLoading, error, refetch } = useSubjectDetailQuery(subjectId);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<QuizSummaryItemDto[]>([]);
  const [checkoutLesson, setCheckoutLesson] = useState<{
    id: string;
    title: string;
    price: number;
  } | null>(null);

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

  const firstUnlockedLesson = subject?.lessons.find((l) => !l.isLocked);

  return (
    <PageLayout
      isLoading={isLoading}
      error={error ? getApiErrorMessage(error) : null}
      onRetry={refetch}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'الرئيسية', href: tenantPath('/') },
            { label: 'المواد', href: tenantPath('/subjects') },
            { label: subject?.title || 'تفاصيل المادة' },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Link to={tenantPath('/subjects')}>
            <Button variant="secondary" size="sm" startIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
              جميع المواد
            </Button>
          </Link>
        </div>
      }
    >
      {subject && (
        <div className="space-y-10">
          {/* Subject Hero Banner */}
          <div className="relative rounded-2xl bg-gradient-to-b from-primary-subtle to-surface border border-border p-6 sm:p-10 shadow-xs text-start">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Thumbnail */}
              {subject.thumbnailUrl ? (
                <div className="w-full md:w-72 aspect-video rounded-xl overflow-hidden border border-border shadow-xs shrink-0 bg-surface">
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
                <div className="w-full md:w-72 aspect-video rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold text-3xl shrink-0 font-heading">
                  {subject.title.charAt(0)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {subject.instructorName ? `المعلم: ${subject.instructorName}` : 'مقرر تعليمي'}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {subject.lessons.length} {subject.lessons.length === 1 ? 'درس' : 'دروس'}
                  </Badge>
                  {!subject.isPublished && (
                    <Badge variant="warning" size="sm">
                      مسودة (مرئي لك كمعلم فقط)
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-text-main leading-tight">
                  {subject.title}
                </h1>

                <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                  {subject.description || 'لا يوجد وصف مضاف لهذا المقرر التعليمي حتى الآن.'}
                </p>

                {/* Quick CTA */}
                {subject.lessons.length > 0 && (
                  <div className="pt-2">
                    {isAuthenticated ? (
                      firstUnlockedLesson && (
                        <Link to={tenantPath(`/subjects/${subject.id}/lessons/${firstUnlockedLesson.id}`)}>
                          <Button variant="primary" size="md" className="font-bold" startIcon={<PlayCircle className="w-4 h-4" />}>
                            بدء المشاهدة
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

          {/* Lessons List Section (grouped by Module / Month when present) */}
          <div className="space-y-6 text-start">
            <div className="pb-3 border-b border-border">
              <h2 className="text-xl font-bold font-heading text-text-main">
                محتويات وخطة المادة
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                قائمة الأبواب والمحاضرات المرتبة لمتابعة مسار التعلم خطوة بخطوة
              </p>
            </div>

            {subject.lessons.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-10 h-10 text-text-muted" />}
                title="لا توجد دروس مضافة لهذا المادة بعد"
                description="لم يقم المعلم برفع محتويات هذا المقرر حتى الآن. تفقد الصفحة في وقت لاحق."
              />
            ) : (
              <div className="space-y-6">
                {moduleGroups.map((group, gIdx) => {
                  const completedInGroup = group.items.filter((i) => i.lesson.isCompleted).length;
                  return (
                    <div key={`${group.title ?? 'all'}-${gIdx}`} className="space-y-3">
                      {group.title && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-subtle border border-border">
                          <div className="flex items-center gap-2 font-bold text-text-main text-sm sm:text-base font-heading">
                            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                            <span>{group.title}</span>
                          </div>
                          {isAuthenticated && (
                            <Badge variant="neutral" size="sm">
                              {completedInGroup} / {group.items.length} مكتمل
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                        {group.items.map(({ lesson, idx }) => {
                          const normType = normalizeContentType(lesson.contentType);
                          const isLocked = !!lesson.isLocked;
                          const isPaymentLocked = isLocked && lesson.lockReason === 'payment_required';
                          const scheduledLabel =
                            lesson.lockReason === 'scheduled' && lesson.availableAt
                              ? `يُفتح في ${formatDateArabic(lesson.availableAt)}`
                              : isPaymentLocked
                                ? `محاضرة مدفوعة — افتحها الآن عبر فوري أو المحافظ أو البطاقة (${lesson.price} ج.م)`
                                : lesson.lockReason;

                          return (
                            <Card
                              key={lesson.id}
                              className={`p-4 transition-all border-border ${
                                isLocked
                                  ? 'bg-surface-subtle/70 opacity-85'
                                  : 'hover:border-primary/40 hover:shadow-xs'
                              }`}
                            >
                              <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 font-heading ${
                                      lesson.isCompleted
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                        : isLocked
                                          ? 'bg-surface border-border text-text-subtle'
                                          : 'bg-surface-subtle border-border text-text-muted'
                                    }`}
                                  >
                                    {lesson.isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : isLocked ? (
                                      <Lock className="w-3.5 h-3.5" />
                                    ) : (
                                      idx + 1
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0 text-start">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h3 className="font-bold text-sm sm:text-base text-text-main">
                                        {lesson.title}
                                      </h3>
                                      <Badge variant="neutral" size="sm" className="gap-1">
                                        {getTypeIcon(normType)}
                                        <span>{CONTENT_TYPE_LABELS[normType]}</span>
                                      </Badge>
                                      {lesson.isCompleted && (
                                        <Badge variant="success" size="sm" className="gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>مكتمل</span>
                                        </Badge>
                                      )}
                                      {lesson.attachmentUrl && (
                                        <Badge variant="neutral" size="sm" className="gap-1">
                                          <Paperclip className="w-3 h-3" />
                                          <span>ملزمة مرفقة</span>
                                        </Badge>
                                      )}
                                      {lesson.price !== undefined && lesson.price > 0 && (
                                        <Badge
                                          variant={lesson.isPurchased ? 'success' : 'info'}
                                          size="sm"
                                        >
                                          {lesson.isPurchased ? 'تم الشراء ✓' : `${lesson.price} ج.م`}
                                        </Badge>
                                      )}
                                      {!lesson.isPublished && (
                                        <Badge variant="warning" size="sm">
                                          مسودة
                                        </Badge>
                                      )}
                                    </div>

                                    {isLocked && scheduledLabel ? (
                                      <p className="text-xs text-warning font-medium flex items-center gap-1.5 mt-0.5">
                                        <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                                        <span>{scheduledLabel}</span>
                                      </p>
                                    ) : (
                                      lesson.description && (
                                        <p className="text-xs text-text-muted line-clamp-1">
                                          {lesson.description}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 self-end sm:self-center">
                                  {isAuthenticated ? (
                                    isPaymentLocked ? (
                                      <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
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
                                        className="text-xs"
                                        startIcon={<Lock className="w-3.5 h-3.5" />}
                                      >
                                        مقفل حالياً
                                      </Button>
                                    ) : (
                                      <Link to={tenantPath(`/subjects/${subject.id}/lessons/${lesson.id}`)}>
                                        <Button
                                          variant={lesson.isCompleted ? 'outline' : 'primary'}
                                          size="sm"
                                          startIcon={<PlayCircle className="w-3.5 h-3.5" />}
                                        >
                                          {lesson.isCompleted ? 'مراجعة الدرس' : 'مشاهدة الدرس'}
                                        </Button>
                                      </Link>
                                    )
                                  ) : (
                                    <Link to={tenantPath('/login')} state={{ from: location }}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs text-primary font-bold"
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Homeworks & Exams Section (for logged-in members) */}
          {isAuthenticated && quizzes.length > 0 && (
            <div className="space-y-4 text-start">
              <div className="pb-3 border-b border-border">
                <h2 className="text-xl font-bold font-heading text-text-main flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <span>الواجبات والامتحانات ({quizzes.length})</span>
                </h2>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                  حل الواجبات والامتحانات أونلاين واحصل على درجتك فوراً
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => {
                  const kind = normalizeAssessmentType(quiz.type);
                  const sub = quiz.mySubmission;
                  return (
                    <Card key={quiz.id} className="border-border">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
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
                          <p className="text-xs text-text-muted">
                            {quiz.questionsCount} سؤال • {quiz.totalScore} درجة
                          </p>
                        </div>

                        <Link to={tenantPath(`/subjects/${subject.id}/quizzes/${quiz.id}`)}>
                          <Button
                            variant={sub ? 'outline' : 'primary'}
                            size="sm"
                            className="font-bold shrink-0"
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
