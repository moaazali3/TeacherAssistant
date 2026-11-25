import { z } from 'zod';

/**
 * Reusable password validation rule:
 * Minimum 8 characters, maximum 100 characters, at least one letter and at least one digit.
 * Each constraint provides a distinct, clear Arabic message.
 */
export const passwordRuleSchema = z
  .string()
  .min(1, 'كلمة المرور مطلوبة')
  .min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف')
  .max(100, 'كلمة المرور يجب ألا تتجاوز 100 حرف')
  .regex(/\p{L}/u, 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerTeacherSchema = z.object({
  name: z
    .string()
    .min(2, 'الاسم الكامل يجب ألا يقل عن حرفين')
    .max(150, 'الاسم الكامل يجب ألا يتجاوز 150 حرفاً'),
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .max(256, 'البريد الإلكتروني طويل جداً'),
  password: passwordRuleSchema,
  subdomain: z
    .string()
    .min(3, 'اسم النطاق يجب ألا يقل عن 3 أحرف')
    .max(63, 'اسم النطاق يجب ألا يتجاوز 63 حرفاً')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'يسمح فقط بالأحرف الإنجليزية الصغيرة والأرقام والشرطات الداخلية (-)')
    .transform((val) => val.toLowerCase().trim()),
  tenantName: z
    .string()
    .min(2, 'اسم المنصة يجب ألا يقل عن حرفين')
    .max(150, 'اسم المنصة يجب ألا يتجاوز 150 حرفاً')
    .optional()
    .or(z.literal('')),
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
    .max(1000, 'الوصف التعريفي يجب ألا يتجاوز 1000 حرف')
    .optional()
    .or(z.literal('')),
});

export type RegisterTeacherFormData = z.infer<typeof registerTeacherSchema>;

const phoneRuleSchema = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(/^\+?[0-9]{10,15}$/, 'أدخل رقم هاتف صحيح مكون من 10 إلى 15 رقماً (مثال: 01012345678)');

export const registerStudentSchema = z
  .object({
    name: z
      .string()
      .min(2, 'الاسم الكامل يجب ألا يقل عن حرفين')
      .max(150, 'الاسم الكامل يجب ألا يتجاوز 150 حرفاً'),
    email: z
      .string()
      .min(1, 'البريد الإلكتروني مطلوب')
      .email('صيغة البريد الإلكتروني غير صحيحة')
      .max(256, 'البريد الإلكتروني طويل جداً'),
    password: passwordRuleSchema,
    confirmPassword: z
      .string()
      .min(1, 'تأكيد كلمة المرور مطلوب'),
    dateOfBirth: z
      .string()
      .min(1, 'تاريخ الميلاد مطلوب')
      .refine(
        (val) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
          const parsed = new Date(`${val}T00:00:00Z`);
          if (Number.isNaN(parsed.getTime())) return false;
          const minDate = new Date('1950-01-01T00:00:00Z');
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() - 6);
          return parsed >= minDate && parsed <= maxDate;
        },
        { message: 'أدخل تاريخ ميلاد صحيح (العمر 6 سنوات على الأقل)' }
      ),
    gender: z.enum(['Male', 'Female'], { message: 'يرجى اختيار النوع' }),
    phoneNumber: phoneRuleSchema('رقم هاتف الطالب مطلوب'),
    parentPhoneNumber: phoneRuleSchema('رقم هاتف ولي الأمر مطلوب'),
    joinCode: z
      .string()
      .trim()
      .min(1, 'كود الجروب مطلوب للتسجيل')
      .length(8, 'كود الجروب يجب أن يتكون من 8 أحرف وأرقام بالضبط')
      .regex(/^[A-Za-z0-9]{8}$/, 'كود الجروب يجب أن يتكون من 8 أحرف وأرقام إنجليزية فقط')
      .transform((val) => val.toUpperCase()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  })
  .refine((data) => data.phoneNumber !== data.parentPhoneNumber, {
    message: 'رقم هاتف ولي الأمر يجب أن يكون مختلفاً عن رقم الطالب',
    path: ['parentPhoneNumber'],
  });

export type RegisterStudentFormData = z.infer<typeof registerStudentSchema>;

export const resetPasswordSchema = z.object({
  newPassword: passwordRuleSchema,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
