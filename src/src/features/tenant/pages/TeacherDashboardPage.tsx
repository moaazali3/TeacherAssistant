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
  Sparkles,
  Users,
  UserCog,
} from 'lucide-react';

interface QuickNavItem {
  to: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgClass: string;
}

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

  const quickNavItems: QuickNavItem[] = [
    {
      to: platformPath('/dashboard/teacher/subjects'),
      title: 'المواد الدراسية',
      subtitle: `${subjects.length} مادة مسجلة`,
      icon: <BookOpen className="w-5 h-5" />,
      iconBgClass: 'bg-primary-light text-primary',
    },
    {
      to: platformPath('/dashboard/teacher/students'),
      title: 'متابعة الطلاب',
      subtitle: 'التقدم والدرجات والحضور',
      icon: <Users className="w-5 h-5" />,
      iconBgClass: 'bg-info-bg text-info',
    },
    {
      to: platformPath('/dashboard/teacher/assistants'),
      title: 'فريق المساعدين',
      subtitle: 'إدارة الصلاحيات والمساعدين',
      icon: <UserCog className="w-5 h-5" />,
      iconBgClass: 'bg-success-bg text-success',
    },
    {
      to: platformPath('/dashboard/teacher/landing'),
      title: 'الصفحة الرئيسية',
      subtitle: 'القوالب والأقسام والمعاينة',
      icon: <Sparkles className="w-5 h-5" />,
      iconBgClass: 'bg-primary-subtle text-primary',
    },
    {
      to: platformPath('/dashboard/teacher/branding'),
      title: 'المظهر والهوية',
      subtitle: 'الشعار والألوان والنبذة',
      icon: <Palette className="w-5 h-5" />,
      iconBgClass: 'bg-warning-bg text-warning',
    },
  ];

  return (
    <PageLayout
      title={`مرحباً بك، أستاذ ${user?.name || ''}`}
      description="لوحة التحكم المركزية لإدارة المواد الدراسية، والدروس، والمجموعات، والطلاب."
      isLoading={isLoading}
      skeleton={
        <div className="space-y-6">
          <div className="h-14 bg-surface-hover rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
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
      actions={
        <>
          {tenantFullUrl && (
            <a href={tenantFullUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" endIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                زيارة المنصة
              </Button>
            </a>
          )}
          <Link to={platformPath('/dashboard/teacher/subjects/new')}>
            <Button variant="primary" size="sm" className="font-bold" startIcon={<Plus className="w-4 h-4" />}>
              إضافة مادة جديدة
            </Button>
          </Link>
        </>
      }
    >
      <div className="space-y-8 text-start">
        {/* Slim Platform Link Bar */}
        {tenantFullUrl && (
          <div className="bg-surface border border-border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
                <span className="text-xs font-bold text-text-main shrink-0">رابط منصتك للطلاب:</span>
                <span className="text-xs text-text-muted font-mono truncate" dir="ltr">
                  {tenantFullUrl}
                </span>
              </div>
            </div>

            <Button
              variant={copiedLink ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleCopyTenantLink}
              startIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              className="font-bold text-xs shrink-0 self-start sm:self-auto"
            >
              {copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}
            </Button>
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

        {/* Quick Management & Customization Navigation */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-text-muted">أدوات الإدارة والتخصيص</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {quickNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group bg-surface border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBgClass}`}>
                    {item.icon}
                  </div>
                  <ArrowLeft className="w-4 h-4 text-text-subtle group-hover:text-primary group-hover:-translate-x-0.5 transition-all rtl:rotate-0" />
                </div>
                <div>
                  <p className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{item.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

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
