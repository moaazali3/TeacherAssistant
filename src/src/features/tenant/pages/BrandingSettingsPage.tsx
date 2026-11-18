import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenant } from '../useTenant';
import { tenantPath, platformPath, buildTenantFullUrl, useTenantSlug } from '@/lib/tenant';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/components/ui/Toast';
import { PageLayout } from '@/components/ui/PageLayout';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getApiErrorMessage } from '@/lib/api';

const brandingSchema = z.object({
  name: z
    .string()
    .min(2, 'اسم المنصة يجب ألا يقل عن حرفين')
    .max(150, 'اسم المنصة يجب ألا يتجاوز 150 حرفاً'),
  logoUrl: z
    .string()
    .url('رابط الشعار يجب أن يكون رابطاً صالحاً (URL)')
    .optional()
    .or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'يجب إدخال كود لون سداسي عشري صحيح مثل #0F766E')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(1000, 'الوصف يجب ألا يتجاوز 1000 حرف')
    .optional()
    .or(z.literal('')),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export const BrandingSettingsPage: React.FC = () => {
  const { tenant, isLoading, error: tenantError, updateBranding, applyThemeColor, resetThemeColor } = useTenant();
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      primaryColor: '#0F766E',
      bio: '',
    },
  });

  // Populate form when tenant loads
  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name || '',
        logoUrl: tenant.logoUrl || '',
        primaryColor: tenant.primaryColor || '#0F766E',
        bio: tenant.bio || '',
      });
    }
  }, [tenant, reset]);

  // Watch fields for live preview
  const watchedName = watch('name');
  const watchedLogoUrl = watch('logoUrl');
  const watchedPrimaryColor = watch('primaryColor');
  const watchedBio = watch('bio');

  // Dynamically update theme variable when primaryColor changes
  useEffect(() => {
    if (watchedPrimaryColor && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(watchedPrimaryColor)) {
      applyThemeColor(watchedPrimaryColor);
    }
  }, [watchedPrimaryColor, applyThemeColor]);

  // Clean up on page unmount: ensure saved tenant color stays
  useEffect(() => {
    return () => {
      resetThemeColor();
    };
  }, [resetThemeColor]);

  const onSubmit = async (data: BrandingFormData) => {
    try {
      setIsSubmitting(true);
      await updateBranding({
        name: data.name,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || null,
        bio: data.bio || null,
      });
      success('تم حفظ إعدادات الهوية والمظهر بنجاح!');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل تحديث إعدادات المظهر'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetColors = [
    { label: 'أزرق تركواز (افتراضي)', hex: '#0F766E' },
    { label: 'أزرق نيلي', hex: '#4338CA' },
    { label: 'أزرق سماوي', hex: '#0284C7' },
    { label: 'بنفسجي ملكي', hex: '#7E22CE' },
    { label: 'أخضر زمردي', hex: '#059669' },
    { label: 'برتقالي كهرماني', hex: '#D97706' },
    { label: 'عنابي / ياقوتي', hex: '#BE123C' },
    { label: 'فحمي داكن', hex: '#334155' },
  ];

  const { user } = useAuth();
  const currentSlug = useTenantSlug() || user?.tenantSubdomain || tenant?.subdomain;
  const previewUrl = currentSlug ? buildTenantFullUrl(currentSlug, '/') : tenantPath('/');

  return (
    <PageLayout
      title="إعدادات الهوية والمظهر"
      description="قم بتخصيص اسم منصتك، الشعار، لون الهوية البصرية، والنبذة التعريفية. يمكنك معاينة التغييرات مباشرة."
      isLoading={isLoading}
      error={tenantError}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'المظهر والهوية' },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Link to={platformPath('/dashboard/teacher')}>
            <Button variant="secondary" size="sm">
              ← لوحة التحكم
            </Button>
          </Link>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              معاينة المنصة كزائر ↗
            </Button>
          </a>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>بيانات وهوية المنصة</CardTitle>
                <CardDescription>
                  هذه البيانات تظهر لجميع الطلاب والزوار داخل نطاقك التعليمي ({tenant?.subdomain}.localhost)
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Platform Name */}
                <Input
                  label="اسم المنصة أو الأستاذ"
                  required
                  placeholder="مثال: أكاديمية الأستاذ أحمد في الفيزياء"
                  error={errors.name?.message}
                  {...register('name')}
                />

                {/* Subdomain (Read only) */}
                <Input
                  label="النطاق الفرعي (المسار)"
                  disabled
                  value={tenant?.subdomain || ''}
                  helperText="لا يمكن تغيير اسم النطاق الفرعي بعد الإنشاء حفاظاً على روابط الطلاب."
                />

                {/* Logo URL */}
                <Input
                  label="رابط الشعار (Logo URL)"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  error={errors.logoUrl?.message}
                  helperText="أدخل رابط صورة مباشر بصيغة PNG أو JPG أو SVG."
                  {...register('logoUrl')}
                />

                {/* Primary Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1.5 select-none">
                    لون الهوية الأساسي (Primary Color)
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="color"
                      value={watchedPrimaryColor && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(watchedPrimaryColor) ? watchedPrimaryColor : '#0F766E'}
                      onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className="w-12 h-10 rounded border border-border cursor-pointer p-0.5 bg-surface"
                      aria-label="اختر لون الهوية"
                    />
                    <div className="flex-1">
                      <Input
                        placeholder="#0F766E"
                        error={errors.primaryColor?.message}
                        {...register('primaryColor')}
                      />
                    </div>
                  </div>

                  {/* Preset color swatches */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {presetColors.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setValue('primaryColor', p.hex, { shouldDirty: true, shouldValidate: true })}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-border hover:border-text-muted transition-colors bg-surface"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.hex }} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="text-start">
                  <label className="block text-sm font-medium text-text-main mb-1.5 select-none">
                    النبذة التعريفية (Bio)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="اكتب نبذة تعريفية تشرح خبراتك التعليمية والمناهج التي تقدمها..."
                    className="w-full bg-surface text-text-main border border-border rounded-md px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-subtle"
                    {...register('bio')}
                  />
                  {errors.bio?.message && (
                    <p className="mt-1.5 text-xs text-danger font-medium">{errors.bio.message}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!isDirty && !isSubmitting}
                >
                  حفظ التغييرات
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset();
                    resetThemeColor();
                  }}
                  disabled={!isDirty || isSubmitting}
                >
                  إلغاء التعديلات
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-24">
          <Card className="overflow-hidden border-2 border-primary/40 shadow-md">
            <CardHeader className="bg-surface-hover/70 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <span>معاينة حية للمنصة (Live Preview)</span>
                </CardTitle>
                <Badge variant="primary" size="sm">مباشر</Badge>
              </div>
              <CardDescription>
                هكذا تظهر واجهة المنصة للطلاب فور تطبيق التعديلات
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 bg-gradient-to-b from-primary-subtle to-surface">
              {/* Preview Hero Mockup */}
              <div className="flex flex-col items-center text-center p-6 border border-border/80 rounded-xl bg-surface/90 shadow-sm backdrop-blur-sm">
                {/* Preview Logo */}
                {watchedLogoUrl ? (
                  <div className="w-20 h-20 rounded-full border-2 border-border shadow-sm overflow-hidden mb-4 bg-surface">
                    <img
                      src={watchedLogoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-sm mb-4 border-2 border-surface font-heading">
                    {(watchedName || 'أ').charAt(0).toUpperCase()}
                  </div>
                )}

                <Badge variant="primary" size="sm" className="mb-2">
                  نطاق: {tenant?.subdomain}.localhost
                </Badge>

                <h4 className="text-xl font-black text-text-main font-heading mb-2">
                  {watchedName || 'اسم المنصة التعليمية'}
                </h4>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-6">
                  {watchedBio || 'هنا تظهر النبذة التعريفية الخاصة بك لشرح خبراتك التعليمية للطلاب...'}
                </p>

                {/* Sample Buttons Themed */}
                <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                  <Button variant="primary" size="sm" className="w-full sm:w-auto">
                    تسجيل دخول الطالب
                  </Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    تصفح المواد
                  </Button>
                </div>
              </div>

              {/* Theme Color Indicator */}
              <div className="mt-4 p-3 bg-surface rounded-lg border border-border text-xs flex items-center justify-between">
                <span className="text-text-muted">اللون المحدد حالياً:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-text-main">{watchedPrimaryColor}</span>
                  <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: watchedPrimaryColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
