import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { registerStudentSchema, RegisterStudentFormData } from '../schemas';
import { useAuth } from '../useAuth';
import { useTenant } from '@/features/tenant/useTenant';
import { tenantPath } from '@/lib/tenant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage, applyServerValidationErrors, useRateLimitCooldown } from '@/lib/api';
import { User, Mail, Lock, KeyRound, UserPlus, Clock } from 'lucide-react';

export const StudentRegisterPage: React.FC = () => {
  const { registerStudent } = useAuth();
  const { tenant } = useTenant();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, countdown, startCooldown } = useRateLimitCooldown(30);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterStudentFormData>({
    resolver: zodResolver(registerStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      joinCode: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (data: RegisterStudentFormData) => {
    if (isCoolingDown) return;

    try {
      setIsSubmitting(true);
      await registerStudent(data);
      success('تم إنشاء حسابك والانضمام للمجموعة بنجاح! أهلاً بك.');
      navigate(tenantPath('/my-subjects'), { replace: true });
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
              <CardTitle className="text-2xl font-black font-heading">إنشاء حساب طالب</CardTitle>
              <CardDescription>
                الانضمام إلى منصة {tenant?.name || 'التعليمية'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                label="الاسم الكامل"
                required
                placeholder="محمد علي"
                startAdornment={<User className="w-4 h-4 text-text-subtle" />}
                error={errors.name?.message}
                {...register('name')}
              />

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
                placeholder="8 أحرف على الأقل"
                startAdornment={<Lock className="w-4 h-4 text-text-subtle" />}
                error={errors.password?.message}
                helperText="8 أحرف على الأقل، تتضمن حرفاً ورقماً."
                {...register('password')}
              />

              <div>
                <Input
                  label="كود الجروب"
                  required
                  placeholder="مثال: SAT5CHEM"
                  maxLength={8}
                  dir="ltr"
                  startAdornment={<KeyRound className="w-4 h-4 text-text-subtle" />}
                  className="font-mono uppercase tracking-widest text-center"
                  error={errors.joinCode?.message}
                  {...register('joinCode')}
                />
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  أدخل كود الجروب المكون من 8 خانات المقدم من المعلم للانضمام المباشر.
                </p>
              </div>
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
                startIcon={!isCoolingDown ? <UserPlus className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              >
                {isCoolingDown ? `يرجى الانتظار (${countdown} ثانية)` : 'إنشاء الحساب'}
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-text-muted">
                <span>
                  لديك حساب بالفعل؟{' '}
                  <Link to={tenantPath('/login')} className="text-primary font-bold hover:underline">
                    تسجيل الدخول
                  </Link>
                </span>
                <Link to={tenantPath('/')} className="hover:text-primary transition-colors">
                  ← رئيسية المنصة
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};
