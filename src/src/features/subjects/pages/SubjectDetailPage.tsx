import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSubjectDetailQuery } from '../useSubjects';
import { useAuth } from '@/features/auth/useAuth';
import { normalizeContentType, CONTENT_TYPE_LABELS } from '../types';
import { tenantPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getApiErrorMessage } from '@/lib/api';
import {
  PlayCircle,
  Lock,
  BookOpen,
  ArrowRight,
  Video,
  FileText,
  Link as LinkIcon,
  File,
} from 'lucide-react';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { data: subject, isLoading, error, refetch } = useSubjectDetailQuery(subjectId);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

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
                      <Link to={tenantPath(`/subjects/${subject.id}/lessons/${subject.lessons[0].id}`)}>
                        <Button variant="primary" size="md" className="font-bold" startIcon={<PlayCircle className="w-4 h-4" />}>
                          بدء المشاهدة من الدرس الأول
                        </Button>
                      </Link>
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

          {/* Lessons List Section */}
          <div className="space-y-4 text-start">
            <div className="pb-3 border-b border-border">
              <h2 className="text-xl font-bold font-heading text-text-main">
                محتويات وخطة المادة
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                قائمة الدروس والمحاضرات المرتبة لمتابعة مسار التعلم خطوة بخطوة
              </p>
            </div>

            {subject.lessons.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-10 h-10 text-text-muted" />}
                title="لا توجد دروس مضافة لهذا المادة بعد"
                description="لم يقم المعلم برفع محتويات هذا المقرر حتى الآن. تفقد الصفحة في وقت لاحق."
              />
            ) : (
              <div className="space-y-3">
                {subject.lessons.map((lesson, idx) => {
                  const normType = normalizeContentType(lesson.contentType);

                  return (
                    <Card
                      key={lesson.id}
                      className="p-4 transition-all hover:border-primary/40 hover:shadow-xs border-border"
                    >
                      <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Index & Title */}
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border text-text-muted flex items-center justify-center font-bold text-xs shrink-0 font-heading">
                            {idx + 1}
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
                              {!lesson.isPublished && (
                                <Badge variant="warning" size="sm">
                                  مسودة
                                </Badge>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-xs text-text-muted line-clamp-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action: Open Lesson if logged in, or "Login to watch" */}
                        <div className="shrink-0 self-end sm:self-center">
                          {isAuthenticated ? (
                            <Link to={tenantPath(`/subjects/${subject.id}/lessons/${lesson.id}`)}>
                              <Button variant="primary" size="sm" startIcon={<PlayCircle className="w-3.5 h-3.5" />}>
                                مشاهدة الدرس
                              </Button>
                            </Link>
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
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
};
