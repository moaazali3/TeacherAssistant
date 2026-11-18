import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLessonDetailQuery, useSubjectDetailQuery } from '../useSubjects';
import { LessonEmbedPlayer } from '../components/LessonEmbedPlayer';
import { normalizeContentType, CONTENT_TYPE_LABELS } from '../types';
import { tenantPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getApiErrorMessage } from '@/lib/api';
import { ArrowRight, ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';

export const LessonViewerPage: React.FC = () => {
  const { subjectId, lessonId } = useParams<{ subjectId: string; lessonId: string }>();

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

  const isLoading = isLessonLoading || isSubjectLoading;

  // Calculate Next and Previous lessons in sequence
  const lessons = subject?.lessons || [];
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <PageLayout
      isLoading={isLoading}
      error={lessonError ? getApiErrorMessage(lessonError) : null}
      onRetry={refetchLesson}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'المواد', href: tenantPath('/subjects') },
            ...(subject
              ? [{ label: subject.title, href: tenantPath(`/subjects/${subject.id}`) }]
              : []),
            { label: lesson?.title || 'مشاهدة الدرس' },
          ]}
        />
      }
      actions={
        subjectId ? (
          <Link to={tenantPath(`/subjects/${subjectId}`)}>
            <Button variant="secondary" size="sm" startIcon={<BookOpen className="w-4 h-4" />}>
              قائمة دروس المادة
            </Button>
          </Link>
        ) : null
      }
    >
      {lesson && (
        <div className="space-y-6 text-start max-w-5xl mx-auto">
          {/* Lesson Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="md">
                الدرس {currentIndex >= 0 ? currentIndex + 1 : lesson.sortOrder} من {lessons.length || 1}
              </Badge>
              <Badge variant="neutral" size="md">
                {CONTENT_TYPE_LABELS[normalizeContentType(lesson.contentType)]}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-main">
              {lesson.title}
            </h1>

            {lesson.description && (
              <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Embedded Player Section */}
          <LessonEmbedPlayer lesson={lesson} />

          {/* Bottom Next / Previous Navigation Bar */}
          <Card className="mt-8 border-border">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Previous Lesson */}
              <div className="w-full sm:w-auto text-start">
                {prevLesson ? (
                  <Link
                    to={tenantPath(`/subjects/${subjectId}/lessons/${prevLesson.id}`)}
                    className="flex flex-col items-start gap-1 p-2 rounded-xl hover:bg-surface-hover transition-colors group"
                  >
                    <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
                      <span>الدرس السابق</span>
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

              {/* Subject Outline Center Link */}
              {subjectId && (
                <Link to={tenantPath(`/subjects/${subjectId}`)}>
                  <Button variant="outline" size="sm" className="hidden md:inline-flex" startIcon={<BookOpen className="w-3.5 h-3.5" />}>
                    فهرس المادة ({lessons.length} درس)
                  </Button>
                </Link>
              )}

              {/* Next Lesson */}
              <div className="w-full sm:w-auto text-end">
                {nextLesson ? (
                  <Link
                    to={tenantPath(`/subjects/${subjectId}/lessons/${nextLesson.id}`)}
                    className="flex flex-col items-end gap-1 p-2 rounded-xl hover:bg-surface-hover transition-colors group"
                  >
                    <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                      <span>الدرس التالي</span>
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0" />
                    </span>
                    <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">
                      {nextLesson.title}
                    </span>
                  </Link>
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
      )}
    </PageLayout>
  );
};
