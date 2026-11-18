import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useTenant } from '@/features/tenant/useTenant';
import { useMySubjectsQuery } from '@/features/subjects/useSubjects';
import { platformPath, buildTenantFullUrl } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubjectCard } from '@/features/subjects/components/SubjectCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getApiErrorMessage } from '@/lib/api';
import {
  Plus,
  BookOpen,
  Palette,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Video,
  ArrowLeft,
  Globe,
} from 'lucide-react';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { data: subjects = [], isLoading, error, refetch } = useMySubjectsQuery();
  const [copiedLink, setCopiedLink] = useState(false);

  const publishedCount = subjects.filter((c) => c.isPublished).length;
  const draftCount = subjects.filter((c) => !c.isPublished).length;
  const totalLessons = subjects.reduce((acc, c) => acc + (c.lessonsCount || 0), 0);

  const teacherSlug = user?.tenantSubdomain || tenant?.subdomain || '';
  const tenantFullUrl = teacherSlug ? buildTenantFullUrl(teacherSlug, '/') : '';

  const handleCopyTenantLink = async () => {
    if (!tenantFullUrl) return;
    try {
      await navigator.clipboard.writeText(tenantFullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <PageLayout
      title={`مرحباً بك، أستاذ ${user?.name || ''}`}
      description="لوحة التحكم المركزية لإدارة المواد الدراسية، والدروس، والمجموعات، والطلاب."
      isLoading={isLoading}
      skeleton={
        <div className="space-y-6">
          <div className="h-20 bg-surface-hover rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      }
      error={error ? getApiErrorMessage(error) : null}
      onRetry={refetch}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم' },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={platformPath('/dashboard/teacher/subjects/new')}>
            <Button variant="primary" size="sm" className="font-bold" startIcon={<Plus className="w-4 h-4" />}>
              إضافة مادة جديدة
            </Button>
          </Link>
          <Link to={platformPath('/dashboard/teacher/subjects')}>
            <Button variant="outline" size="sm" startIcon={<BookOpen className="w-4 h-4" />}>
              المواد الدراسية ({subjects.length})
            </Button>
          </Link>
          <Link to={platformPath('/dashboard/teacher/branding')}>
            <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-main" startIcon={<Palette className="w-4 h-4" />}>
              المظهر والهوية
            </Button>
          </Link>
          {tenantFullUrl && (
            <a href={tenantFullUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" endIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                موقع الطلاب
              </Button>
            </a>
          )}
        </div>
      }
    >
      <div className="space-y-8 text-start">
        {/* Student Platform Link Banner */}
        {tenantFullUrl && (
          <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-main">رابط منصتك التعليمية للطلاب</p>
                <p className="text-xs text-text-muted font-mono mt-0.5">{tenantFullUrl}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={copiedLink ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleCopyTenantLink}
                startIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                className="font-bold text-xs"
              >
                {copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط للطلاب'}
              </Button>
              <a href={tenantFullUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm" className="text-xs font-bold" endIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  زيارة المنصة
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Real Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted">إجمالي المواد الدراسية</p>
                  <p className="text-2xl font-black text-text-main font-heading mt-1">{subjects.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-text-muted">
                <span>المواد المسجلة في منصتك</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted">المواد المنشورة للطلاب</p>
                  <p className="text-2xl font-black text-success font-heading mt-1">{publishedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-success-bg text-success flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-text-muted">
                <Badge variant="success" size="sm">متاحة لمجموعات الطلاب</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted">المسودات قيد التجهيز</p>
                  <p className="text-2xl font-black text-warning font-heading mt-1">{draftCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-text-muted">
                <span>مرئية لك فقط</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted">إجمالي الدروس</p>
                  <p className="text-2xl font-black text-text-main font-heading mt-1">{totalLessons}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-info-bg text-info flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-text-muted">
                <span>فيديو، درايف، و PDF</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xl font-bold font-heading text-text-main">
              المواد الدراسية الأخيرة
            </h3>
            <Link to={platformPath('/dashboard/teacher/subjects')}>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:underline"
                endIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-0" />}
              >
                عرض كافة المواد ({subjects.length})
              </Button>
            </Link>
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-primary" />}
              title="لم تقم بإضافة أي مادة دراسية بعد"
              description="أنشئ مادتك الأولى الآن، وأنشئ مجموعات للطلاب ونظّم الدروس والشروحات بسهولة."
              action={
                <Link to={platformPath('/dashboard/teacher/subjects/new')}>
                  <Button variant="primary" startIcon={<Plus className="w-4 h-4" />}>
                    إضافة أول مادة الآن
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.slice(0, 3).map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isTeacherView
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
