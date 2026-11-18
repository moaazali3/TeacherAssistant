import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { registerTeacherSchema, RegisterTeacherFormData } from '../schemas';
import { useAuth } from '../useAuth';
import { apiClient, ApiResponse, getApiErrorMessage, applyServerValidationErrors, useRateLimitCooldown } from '@/lib/api';
import { SubdomainAvailabilityDto } from '@/features/tenant/types';
import { getTenantMode, platformPath } from '@/lib/tenant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { User, Mail, Lock, Building, Globe, Check, X, Sparkles, Clock } from 'lucide-react';

export const TeacherRegisterPage: React.FC = () => {
  const { registerTeacher } = useAuth();
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, countdown, startCooldown } = useRateLimitCooldown(30);

  // Subdomain live availability state
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainCheckResult, setSubdomainCheckResult] = useState<SubdomainAvailabilityDto | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterTeacherFormData>({
    resolver: zodResolver(registerTeacherSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      subdomain: '',
      tenantName: '',
      primaryColor: '#0F766E',
      bio: '',
    },
    mode: 'onTouched',
  });

  const watchedSubdomain = watch('subdomain');
  const watchedName = watch('name');

  // Debounced live check for subdomain availability
  useEffect(() => {
    if (!watchedSubdomain || watchedSubdomain.length < 3) {
      setSubdomainCheckResult(null);
      setIsCheckingSubdomain(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingSubdomain(true);
        const res = await apiClient.get<ApiResponse<SubdomainAvailabilityDto>>('/tenants/check-subdomain', {
          params: { name: watchedSubdomain },
        });
        if (res.data.success && res.data.data) {
          setSubdomainCheckResult(res.data.data);
        }
      } catch {
        setSubdomainCheckResult(null);
      } finally {
        setIsCheckingSubdomain(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [watchedSubdomain]);

  const onSubmit = async (data: RegisterTeacherFormData) => {
    if (isCoolingDown) return;

    if (subdomainCheckResult && !subdomainCheckResult.available) {
      toastError(subdomainCheckResult.reason || 'اسم النطاق المحدد غير متاح.');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerTeacher({
        name: data.name,
        email: data.email,
        password: data.password,
        subdomain: data.subdomain,
        tenantName: data.tenantName || data.name,
        primaryColor: data.primaryColor || '#0F766E',
        bio: data.bio || '',
      });

      success('تهانينا! تم إنشاء منصتك التعليمية بنجاح.');

      // Navigate to the teacher control panel on the platform site
      setTimeout(() => {
        window.location.href = platformPath('/dashboard/teacher');
      }, 600);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        startCooldown(30);
        return; // Toast handled globally
      }

      const unhandled = applyServerValidationErrors(err, setError);
      if (unhandled) {
        toastError(getApiErrorMessage(err, unhandled));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const mode = getTenantMode();

  return (
    <div className="min-h-screen bg-bg py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center text-start">
      <div className="max-w-xl w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="shadow-lg border-border">
            <CardHeader className="text-center sm:text-start">
              <CardTitle className="text-2xl sm:text-3xl font-black font-heading">
                أنشئ منصتك التعليمية الخاصة
              </CardTitle>
              <CardDescription className="text-base mt-2 leading-relaxed">
                احصل على منصة مستقلة تحمل اسمك وهويتك وعلامتك التجارية لتدريس طلابك، تماماً كمنصة شوبيفاي للمدرسين.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              {/* Teacher Full Name */}
              <Input
                label="الاسم الكامل للمعلم"
                required
                placeholder="أ. أحمد محمد"
                startAdornment={<User className="w-4 h-4 text-text-subtle" />}
                error={errors.name?.message}
                {...register('name')}
              />

              {/* Email Address */}
              <Input
                label="البريد الإلكتروني"
                type="email"
                required
                placeholder="teacher@example.com"
                startAdornment={<Mail className="w-4 h-4 text-text-subtle" />}
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password */}
              <Input
                label="كلمة المرور"
                type="password"
                required
                placeholder="8 أحرف على الأقل"
                startAdornment={<Lock className="w-4 h-4 text-text-subtle" />}
                error={errors.password?.message}
                helperText="8 أحرف على الأقل، تتضمن حرفاً ورقماً."
                {...register('password')}
              />

              {/* Platform Brand Name */}
              <Input
                label="اسم المنصة التعليمية (اختياري)"
                placeholder={watchedName ? `أكاديمية ${watchedName}` : 'مثال: أكاديمية النخبة'}
                startAdornment={<Building className="w-4 h-4 text-text-subtle" />}
                error={errors.tenantName?.message}
                helperText="إذا تركته فارغاً سيتم استخدام اسمك كاسم للمنصة تلقائياً."
                {...register('tenantName')}
              />

              {/* Subdomain with Live Availability Check */}
              <div>
                <Input
                  label="اسم النطاق الفرعي (Subdomain)"
                  required
                  placeholder="ahmed"
                  dir="ltr"
                  className="font-mono text-start"
                  startAdornment={<Globe className="w-4 h-4 text-text-subtle" />}
                  error={errors.subdomain?.message}
                  endAdornment={
                    isCheckingSubdomain ? (
                      <Spinner size="sm" color="primary" />
                    ) : subdomainCheckResult ? (
                      subdomainCheckResult.available ? (
                        <span className="text-success text-xs font-bold flex items-center gap-1" title="متاح">
                          <Check className="w-4 h-4" />
                          <span>متاح</span>
                        </span>
                      ) : (
                        <span className="text-danger text-xs font-bold flex items-center gap-1" title="غير متاح">
                          <X className="w-4 h-4" />
                          <span>غير متاح</span>
                        </span>
                      )
                    ) : null
                  }
                  {...register('subdomain')}
                />

                {/* Subdomain Preview & Availability Hint */}
                <div className="mt-2 text-xs">
                  {watchedSubdomain && watchedSubdomain.length >= 3 && (
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                      <span className="text-text-muted">رابط منصتك سيكون:</span>
                      <span className="font-mono font-bold text-primary dir-ltr" dir="ltr">
                        {mode === 'path'
                          ? `localhost:5173/t/${watchedSubdomain.toLowerCase()}`
                          : `${watchedSubdomain.toLowerCase()}.localhost:5173`}
                      </span>
                    </div>
                  )}

                  {subdomainCheckResult && !subdomainCheckResult.available && (
                    <p className="mt-1.5 text-danger font-medium">
                      {subdomainCheckResult.reason || 'هذا النطاق غير متاح أو محجوز، اختر اسماً آخر.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-6 flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="w-full sm:w-auto flex flex-col gap-2">
                {isCoolingDown && (
                  <p className="text-xs text-warning text-center font-medium bg-warning-bg border border-warning/30 rounded-lg py-1.5 px-3">
                    يرجى الانتظار {countdown} ثانية قبل إعادة المحاولة
                  </p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || isCoolingDown || (subdomainCheckResult !== null && !subdomainCheckResult.available)}
                  startIcon={!isCoolingDown ? <Sparkles className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  className="w-full sm:w-auto font-bold"
                >
                  {isCoolingDown ? `يرجى الانتظار (${countdown} ثانية)` : 'إنشاء المنصة وحساب المعلم'}
                </Button>
              </div>

              <div className="text-xs text-text-muted text-center sm:text-end space-x-2 space-x-reverse">
                <span>لديك حساب بالفعل؟ </span>
                <Link to={platformPath('/teacher/login')} className="text-primary font-bold hover:underline">
                  تسجيل دخول المعلم
                </Link>
                <span> | </span>
                <Link to={platformPath('/')} className="hover:underline">
                  الرئيسية
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};
