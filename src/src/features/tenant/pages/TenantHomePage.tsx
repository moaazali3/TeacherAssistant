import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../useTenant';
import { useAuth } from '@/features/auth/useAuth';
import { tenantPath, platformPath } from '@/lib/tenant';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageLayout } from '@/components/ui/PageLayout';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  Users,
  PlayCircle,
  LogIn,
  UserPlus,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const TenantHomePage: React.FC = () => {
  const { tenant, isLoading, error, refetchTenant } = useTenant();
  const { user, isAuthenticated } = useAuth();

  const isStudent = isAuthenticated && user?.role === 'Student';
  const isTeacher = isAuthenticated && (user?.role === 'Instructor' || user?.role === 'Admin');

  return (
    <PageLayout
      isLoading={isLoading}
      error={error}
      onRetry={refetchTenant}
      className="py-8 sm:py-12"
    >
      {tenant && (
        <div className="space-y-12">
          {/* Hero Banner with Tenant Theming */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary-subtle to-surface border border-border p-8 sm:p-14 text-center">
            {/* Background accent */}
            <div className="absolute top-0 end-0 -mt-12 -me-12 w-64 h-64 rounded-full bg-primary-light/40 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              {/* Logo / Avatar */}
              {tenant.logoUrl ? (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-surface shadow-md overflow-hidden mb-6 bg-surface">
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-md mb-6 border-4 border-surface font-heading">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="primary" size="md" className="gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>منصة تعليمية معتمدة</span>
                </Badge>
                <Badge variant="neutral" size="md">
                  نطاق: {tenant.subdomain}
                </Badge>
              </div>

              {/* Platform Title */}
              <h1 className="text-3xl sm:text-5xl font-black text-text-main font-heading mb-4 tracking-tight leading-tight">
                {tenant.name}
              </h1>

              {/* Bio */}
              <p className="text-base sm:text-lg text-text-muted max-w-2xl leading-relaxed mb-8">
                {tenant.bio || 'مرحباً بكم في منصتي التعليمية الخاصة. هنا تجدون كافة المناهج والشروحات التفاعلية والاختبارات الذكية لمساعدتكم على التفوق والتميز.'}
              </p>

              {/* Action Buttons (Strictly Student View) */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {isStudent ? (
                  <>
                    <Link to={tenantPath('/my-subjects')}>
                      <Button
                        variant="primary"
                        size="lg"
                        className="font-bold"
                        endIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-0" />}
                      >
                        موادي الدراسية
                      </Button>
                    </Link>
                    <Link to={tenantPath('/subjects')}>
                      <Button variant="outline" size="lg" startIcon={<BookOpen className="w-4 h-4" />}>
                        تصفح جميع المواد
                      </Button>
                    </Link>
                  </>
                ) : isTeacher ? (
                  <>
                    <Link to={tenantPath('/subjects')}>
                      <Button variant="primary" size="lg" className="font-bold" startIcon={<BookOpen className="w-4 h-4" />}>
                        تصفح المواد المعروضة للطلاب
                      </Button>
                    </Link>
                    <a href={platformPath('/dashboard/teacher')}>
                      <Button variant="secondary" size="lg" endIcon={<ExternalLink className="w-4 h-4" />}>
                        فتح لوحة تحكم المعلم
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <Link to={tenantPath('/subjects')}>
                      <Button variant="primary" size="lg" className="font-bold" startIcon={<BookOpen className="w-4 h-4" />}>
                        تصفح المواد الدراسية
                      </Button>
                    </Link>
                    <Link to={tenantPath('/login')}>
                      <Button variant="secondary" size="lg" startIcon={<LogIn className="w-4 h-4" />}>
                        تسجيل الدخول
                      </Button>
                    </Link>
                    <Link to={tenantPath('/register')}>
                      <Button variant="outline" size="lg" startIcon={<UserPlus className="w-4 h-4" />}>
                        إنشاء حساب بكود الجروب
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {isTeacher && (
                <div className="mt-5 p-3 rounded-xl bg-surface-subtle border border-border text-xs text-text-muted flex items-center gap-2">
                  <span>ملاحظة: موقع المعلم مخصص للطلاب فقط (عرض فقط). للإدارة والتعديل توجه إلى</span>
                  <a href={platformPath('/dashboard/teacher')} className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                    <span>لوحة التحكم بالمنصة الرئيسية</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Quick Platform Pillars */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
            <Card className="border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <CardTitle>محتوى تعليمي شامل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted leading-relaxed">
                  دروس مسجلة بجودة عالية ومذكرات بصيغة PDF معدة بعناية لتغطية أدق تفاصيل المنهج الدراسي.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle>مجموعات منظمة بأكواد انضمام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted leading-relaxed">
                  انضم إلى مجموعتك الدراسية مباشرة باستخدام كود الجروب وتابع المواعيد والشروحات بدقة.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <CardTitle>مشغلات محتوى متطورة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted leading-relaxed">
                  دعم مباشر لمشغلات يوتيوب، ملفات جوجل درايف، واستعراض ملفات PDF داخل المنصة بسلاسة.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </PageLayout>
  );
};
