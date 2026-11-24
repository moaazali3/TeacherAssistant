import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../useTenant';
import { landingApi } from '@/features/landing/api';
import { LandingRenderer } from '@/features/landing/LandingRenderer';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const TenantHomePage: React.FC = () => {
  const { tenant, isLoading: isTenantLoading } = useTenant();

  const {
    data: landingConfig,
    isLoading: isLandingLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['landing-config', tenant?.id],
    queryFn: () => landingApi.getLandingConfig(),
    enabled: !!tenant,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Dynamically set page title and meta description
  useEffect(() => {
    if (tenant?.name) {
      document.title = `${tenant.name} | المنصة التعليمية`;
      const metaDesc = document.querySelector<HTMLMetaElement>("meta[name='description']");
      if (metaDesc && tenant.bio) {
        metaDesc.content = tenant.bio;
      }
    }
  }, [tenant]);

  if (isTenantLoading || isLandingLoading) {
    return (
      <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12" dir="rtl">
        {/* Hero Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-14 w-3/4 rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-36 rounded-xl" />
              <Skeleton className="h-12 w-36 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-[380px] w-full rounded-3xl" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Subjects Skeleton */}
        <div className="space-y-6 pt-12">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !landingConfig) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-danger-bg text-danger flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-text-main mb-2">
          تعذر تحميل الصفحة الرئيسية للمنصة
        </h2>
        <p className="text-sm text-text-muted max-w-md mb-6 leading-relaxed">
          حدث خطأ أثناء جلب بيانات الصفحة الرئيسية. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.
        </p>
        <Button
          variant="primary"
          onClick={() => refetch()}
          startIcon={<RotateCcw className="w-4 h-4" />}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <LandingRenderer
      config={landingConfig}
      tenantName={tenant?.name}
    />
  );
};
