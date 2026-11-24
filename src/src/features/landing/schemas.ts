import { z } from 'zod';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const landingThemeSchema = z.object({
  primaryColor: z
    .string()
    .regex(hexColorRegex, 'اللون الرئيسي يجب أن يكون كود هيكس صالح (مثل #0F766E)'),
  secondaryColor: z
    .string()
    .regex(hexColorRegex, 'اللون الثانوي يجب أن يكون كود هيكس صالح (مثل #0D9488)'),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, 'لون الخلفية يجب أن يكون كود هيكس صالح (مثل #FFFFFF)'),
  textColor: z
    .string()
    .regex(hexColorRegex, 'لون النصوص يجب أن يكون كود هيكس صالح (مثل #0F172A)'),
  fontFamily: z.enum(['Cairo', 'Tajawal', 'Almarai', 'IBM Plex Sans Arabic'], {
    errorMap: () => ({ message: 'يرجى اختيار خط عربي معتمد' }),
  }),
  borderRadius: z.enum(['none', 'md', 'xl', 'full'], {
    errorMap: () => ({ message: 'يرجى اختيار نمط حواف صالح' }),
  }),
  buttonStyle: z.enum(['solid', 'outline', 'soft'], {
    errorMap: () => ({ message: 'يرجى اختيار نمط أزرار صالح' }),
  }),
  heroImageUrl: z
    .string()
    .refine((val) => !val || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'رابط الصورة يجب أن يبدأ بـ http:// أو https://',
    })
    .optional(),
});
