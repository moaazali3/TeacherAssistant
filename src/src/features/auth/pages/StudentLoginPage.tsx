import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loginSchema, LoginFormData } from '../schemas';
import { useAuth } from '../useAuth';
import { useTenant } from '@/features/tenant/useTenant';
import { tenantPath } from '@/lib/tenant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage, applyServerValidationErrors, useRateLimitCooldown } from '@/lib/api';
import { DemoAccountsBox } from '@/components/ui/DemoAccountsBox';
import { getStudentDemoAccounts } from '@/lib/demoAccounts';
import { groupsApi } from '@/features/groups/api';
import { Mail, Lock, LogIn, Clock } from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { tenant } = useTenant();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, countdown, startCooldown } = useRateLimitCooldown(30);
  const studentDemoAccounts = getStudentDemoAccounts(tenant?.subdomain);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isCoolingDown) return;

    try {
      setIsSubmitting(true);
      const auth = await login(data);
      const isTeacher = auth.role === 'Instructor' || auth.role === 2 || auth.role === 'Admin' || auth.role === 1;
      if (isTeacher) {
        success(`مرحباً بك يا أستاذ ${auth.name}.`);
        navigate(tenantPath('/'), { replace: true });
        return;
      }

      success(`مرحباً بك مجدداً، ${auth.name}!`);

      // Redirect to previous requested page, or directly to single subject, or my-subjects
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      let target = tenantPath('/my-subjects');
      try {
        const myGroups = await groupsApi.getMyGroups();
        if (myGroups.length === 1) {
          target = tenantPath(`/subjects/${myGroups[0].subjectId}`);
        }
      } catch {
        // fallback to /my-subjects
      }
      navigate(target, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        startCooldown(30);
        return; // Toast handled globally by axios interceptor
      }

      const unhandled = applyServerValidationErrors(err, setError);
      if (unhandled) {
        toastError(getApiErrorMessage(err, unhandled));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 text-start">
      <div className="max-w-md w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="shadow-md border-border">
            <CardHeader className="text-center">
              {tenant?.logoUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-border shadow-xs bg-surface">
                  <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto mb-3">
                  {(tenant?.name || 'ط').charAt(0)}
                </div>
              )}
              <CardTitle className="text-2xl font-black font-heading">تسجيل دخول الطلاب</CardTitle>
              <CardDescription>
                مرحباً بك في منصة {tenant?.name || 'التعليمية'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                label="البريد الإلكتروني"
                type="email"
                required
                placeholder="student@example.com"
                startAdornment={<Mail className="w-4 h-4 text-text-subtle" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="كلمة المرور"
                type="password"
                required
                placeholder="أدخل كلمة المرور"
                startAdornment={<Lock className="w-4 h-4 text-text-subtle" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </CardContent>

            <CardFooter className="pt-4 flex-col gap-3">
              {isCoolingDown && (
                <p className="text-xs text-warning text-center font-medium bg-warning-bg border border-warning/30 rounded-lg py-1.5 px-3 w-full">
                  تم حظر المحاولات مؤقتاً لتكرار الطلبات. يرجى الانتظار {countdown} ثانية.
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || isCoolingDown}
                className="w-full font-bold"
                startIcon={!isCoolingDown ? <LogIn className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              >
                {isCoolingDown ? `يرجى الانتظار (${countdown} ثانية)` : 'تسجيل الدخول'}
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-text-muted">
                <span>
                  ليس لديك حساب؟{' '}
                  <Link to={tenantPath('/register')} className="text-primary font-bold hover:underline">
                    إنشاء حساب جديد
                  </Link>
                </span>
                <Link to={tenantPath('/')} className="hover:text-primary transition-colors">
                  ← رئيسية المنصة
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>

        {/* Quick Student Demo Accounts Box (Tenant-Aware) */}
        {studentDemoAccounts.length > 0 && (
          <div className="mt-4">
            <DemoAccountsBox
              accounts={studentDemoAccounts}
              onSelectAccount={(acc) => {
                setValue('email', acc.email, { shouldValidate: true, shouldDirty: true });
                setValue('password', acc.password, { shouldValidate: true, shouldDirty: true });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
