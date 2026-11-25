import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { registerStudentSchema, RegisterStudentFormData } from '../schemas';
import { useAuth } from '../useAuth';
import { PasswordRequirementsChecklist } from '../components/PasswordRequirementsChecklist';
import { useTenant } from '@/features/tenant/useTenant';
import { tenantPath } from '@/lib/tenant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage, applyServerValidationErrors, useRateLimitCooldown } from '@/lib/api';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  UserPlus,
  Clock,
  Phone,
  PhoneCall,
  Calendar,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'بيانات الحساب' },
  { id: 2, title: 'البيانات الشخصية' },
  { id: 3, title: 'الانضمام للجروب' },
] as const;

const STEP_FIELDS: Record<number, (keyof RegisterStudentFormData)[]> = {
  1: ['name', 'email', 'password', 'confirmPassword'],
  2: ['dateOfBirth', 'gender', 'phoneNumber', 'parentPhoneNumber'],
  3: ['joinCode'],
};

const FIELD_TO_STEP: Record<keyof RegisterStudentFormData, number> = {
  name: 1,
  email: 1,
  password: 1,
  confirmPassword: 1,
  dateOfBirth: 2,
  gender: 2,
  phoneNumber: 2,
  parentPhoneNumber: 2,
  joinCode: 3,
};

export const StudentRegisterPage: React.FC = () => {
  const { registerStudent } = useAuth();
  const { tenant } = useTenant();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, countdown, startCooldown } = useRateLimitCooldown(30);

  const initialJoinCode = searchParams.get('joinCode')?.trim().toUpperCase() || '';

  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    setError,
    formState: { errors },
  } = useForm<RegisterStudentFormData>({
    resolver: zodResolver(registerStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      gender: undefined,
      phoneNumber: '',
      parentPhoneNumber: '',
      joinCode: initialJoinCode,
    },
    mode: 'onTouched',
  });

  const watchedPassword = watch('password') || '';
  const watchedGender = watch('gender');

  const handleNextStep = async () => {
    const fields = STEP_FIELDS[currentStep];
    const isStepValid = await trigger(fields);
    if (!isStepValid) return;

    if (currentStep === 1) {
      const { password, confirmPassword } = getValues();
      if (password !== confirmPassword) {
        setError('confirmPassword', {
          type: 'manual',
          message: 'كلمتا المرور غير متطابقتين',
        });
        return;
      }
    }

    if (currentStep === 2) {
      const { phoneNumber, parentPhoneNumber } = getValues();
      if (phoneNumber.trim() === parentPhoneNumber.trim()) {
        setError('parentPhoneNumber', {
          type: 'manual',
          message: 'رقم هاتف ولي الأمر يجب أن يكون مختلفاً عن رقم الطالب',
        });
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: RegisterStudentFormData) => {
    if (isCoolingDown) return;

    try {
      setIsSubmitting(true);
      const { confirmPassword: _confirmPassword, ...payload } = data;
      await registerStudent(payload);
      success('تم إنشاء حسابك والانضمام للمجموعة بنجاح! أهلاً بك.');
      navigate(tenantPath('/my-subjects'), { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        startCooldown(30);
        return;
      }

      let earliestStep: number | null = null;
      const stepAwareSetError: typeof setError = (fieldName, error, options) => {
        setError(fieldName, error, options);
        const stepForField = FIELD_TO_STEP[fieldName as keyof RegisterStudentFormData];
        if (stepForField && (earliestStep === null || stepForField < earliestStep)) {
          earliestStep = stepForField;
        }
      };

      const unhandled = applyServerValidationErrors(err, stepAwareSetError);
      if (earliestStep !== null) {
        setCurrentStep(earliestStep);
      }
      if (unhandled) {
        toastError(getApiErrorMessage(err, unhandled));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (currentStep < 3) {
      e.preventDefault();
      void handleNextStep();
      return;
    }
    void handleSubmit(onSubmit)(e);
  };

  const reviewValues = currentStep === 3 ? getValues() : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 text-start">
      <div className="max-w-lg w-full">
        <form onSubmit={handleFormSubmit} noValidate>
          <Card className="shadow-md border-border">
            <CardHeader className="text-center pb-4">
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

              {/* Progress Stepper */}
              <div className="mt-6 pt-2">
                <div className="flex items-center justify-between relative">
                  {STEPS.map((step, idx) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-1.5 z-10 flex-1">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : isActive
                                  ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                  : 'bg-surface border-border text-text-muted'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              isActive
                                ? 'text-primary font-bold'
                                : isCompleted
                                  ? 'text-text-main font-semibold'
                                  : 'text-text-muted'
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 -mx-4 mb-5 bg-border relative">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: currentStep > step.id ? '100%' : '0%' }}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {currentStep === 1 && (
                <>
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

                  <div>
                    <Input
                      label="كلمة المرور"
                      type="password"
                      required
                      placeholder="اكتب كلمة مرور قوية"
                      startAdornment={<Lock className="w-4 h-4 text-text-subtle" />}
                      error={errors.password?.message}
                      {...register('password')}
                    />
                    <PasswordRequirementsChecklist password={watchedPassword} />
                  </div>

                  <Input
                    label="تأكيد كلمة المرور"
                    type="password"
                    required
                    placeholder="أعد كتابة كلمة المرور"
                    startAdornment={<ShieldCheck className="w-4 h-4 text-text-subtle" />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <Input
                    label="تاريخ الميلاد"
                    type="date"
                    min="1950-01-01"
                    max={maxBirthDate}
                    dir="ltr"
                    required
                    startAdornment={<Calendar className="w-4 h-4 text-text-subtle" />}
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth')}
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      النوع <span className="text-danger ms-1">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { value: 'Male', label: 'ذكر' },
                          { value: 'Female', label: 'أنثى' },
                        ] as const
                      ).map((option) => {
                        const isSelected = watchedGender === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                                : 'border-border bg-surface hover:border-border-strong text-text-main'
                            }`}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              className="sr-only"
                              {...register('gender')}
                            />
                            <span className="text-sm">{option.label}</span>
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border bg-surface'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.gender?.message && (
                      <p className="mt-1.5 text-xs text-danger font-medium">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <Input
                    label="رقم هاتف الطالب"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    autoComplete="tel"
                    required
                    placeholder="01012345678"
                    startAdornment={<Phone className="w-4 h-4 text-text-subtle" />}
                    error={errors.phoneNumber?.message}
                    {...register('phoneNumber')}
                  />

                  <Input
                    label="رقم هاتف ولي الأمر"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    autoComplete="tel"
                    required
                    placeholder="01112345678"
                    startAdornment={<PhoneCall className="w-4 h-4 text-text-subtle" />}
                    error={errors.parentPhoneNumber?.message}
                    helperText="يُستخدم لمتابعة الحضور والمستوى مع ولي الأمر."
                    {...register('parentPhoneNumber')}
                  />
                </>
              )}

              {currentStep === 3 && (
                <>
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

                  {reviewValues && (
                    <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-2.5 text-xs">
                      <p className="font-bold text-text-main text-sm">مراجعة بياناتك قبل التأكيد</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text-muted">
                        <div>
                          <span className="font-semibold text-text-main">الاسم: </span>
                          <span>{reviewValues.name}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-text-main">النوع: </span>
                          <span>
                            {reviewValues.gender === 'Male'
                              ? 'ذكر'
                              : reviewValues.gender === 'Female'
                                ? 'أنثى'
                                : '—'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-text-main">البريد: </span>
                          <span dir="ltr" className="font-mono">
                            {reviewValues.email}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-text-main">تاريخ الميلاد: </span>
                          <span dir="ltr" className="font-mono">
                            {reviewValues.dateOfBirth}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-text-main">هاتف الطالب: </span>
                          <span dir="ltr" className="font-mono">
                            {reviewValues.phoneNumber}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-text-main">هاتف ولي الأمر: </span>
                          <span dir="ltr" className="font-mono">
                            {reviewValues.parentPhoneNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>

            <CardFooter className="pt-4 flex-col gap-3">
              {isCoolingDown && (
                <p className="text-xs text-warning text-center font-medium bg-warning-bg border border-warning/30 rounded-lg py-1.5 px-3 w-full">
                  تم حظر المحاولات مؤقتاً لتكرار الطلبات. يرجى الانتظار {countdown} ثانية.
                </p>
              )}

              <div className="flex items-center gap-3 w-full">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="flex-1 font-bold"
                    startIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    السابق
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleNextStep}
                    className="flex-1 font-bold"
                    endIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    التالي
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || isCoolingDown}
                    className="flex-1 font-bold"
                    startIcon={
                      !isCoolingDown ? <UserPlus className="w-4 h-4" /> : <Clock className="w-4 h-4" />
                    }
                  >
                    {isCoolingDown ? `يرجى الانتظار (${countdown} ثانية)` : 'إنشاء الحساب'}
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between w-full text-xs text-text-muted pt-1">
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
