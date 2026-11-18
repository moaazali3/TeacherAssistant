import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loginSchema, LoginFormData } from '../schemas';
import { useAuth } from '../useAuth';
import { platformPath } from '@/lib/tenant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage, applyServerValidationErrors, useRateLimitCooldown } from '@/lib/api';
import { DemoAccountsBox } from '@/components/ui/DemoAccountsBox';
import { TEACHER_DEMO_ACCOUNTS } from '@/lib/demoAccounts';
import { Mail, Lock, LogIn, GraduationCap, Clock } from 'lucide-react';

export const TeacherLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, countdown, startCooldown } = useRateLimitCooldown(30);

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
      if (!isTeacher) {
        toastError('هذا الحساب ليس حساب معلم مصرح له بإدارة المنصة.');
        return;
      }

      success(`أهلاً بك يا أستاذ ${auth.name}!`);

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const target = from || platformPath('/dashboard/teacher');
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
          <Card className="shadow-md border-t-4 border-t-primary border-border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <Badge variant="primary" size="md" className="gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>بوابة المعلمين والإدارة</span>
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black font-heading">تسجيل دخول المعلم</CardTitle>
              <CardDescription>
                لوحة التحكم المركزية لإدارة المنصة والمواد والمجموعات والطلاب
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                label="البريد الإلكتروني للمعلم"
                type="email"
                required
                placeholder="teacher@example.com"
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

              <div className="flex items-center justify-between w-full text-xs text-text-muted pt-2 border-t border-border-subtle">
                <Link to={platformPath('/register-teacher')} className="text-primary font-bold hover:underline">
                  ليس لديك منصة؟ أنشئ منصتك الآن
                </Link>
                <Link to={platformPath('/')} className="hover:text-primary transition-colors">
                  الرئيسية
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>

        {/* Demo Accounts Helper Box (Visible strictly in Development) */}
        {import.meta.env.DEV && (
          <div className="mt-4">
            <DemoAccountsBox
              accounts={TEACHER_DEMO_ACCOUNTS}
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
