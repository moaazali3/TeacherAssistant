import { z } from 'zod';

export const subjectSchema = z.object({
  title: z
    .string()
    .min(2, 'عنوان المادة مطلوب ويجب ألا يقل عن حرفين')
    .max(200, 'عنوان المادة يجب ألا يتجاوز 200 حرف'),
  description: z
    .string()
    .max(2000, 'الوصف يجب ألا يتجاوز 2000 حرف')
    .optional()
    .or(z.literal('')),
  thumbnailUrl: z
    .string()
    .url('رابط الصورة المصغرة يجب أن يكون رابطاً صالحاً (URL)')
    .optional()
    .or(z.literal('')),
  isPublished: z.boolean().default(false),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

export const lessonSchema = z.object({
  title: z
    .string()
    .min(2, 'عنوان الدرس مطلوب ويجب ألا يقل عن حرفين')
    .max(200, 'عنوان الدرس يجب ألا يتجاوز 200 حرف'),
  description: z
    .string()
    .max(2000, 'الوصف يجب ألا يتجاوز 2000 حرف')
    .optional()
    .or(z.literal('')),
  contentType: z.enum(['Video', 'Pdf', 'Word', 'Article', 'Link'], {
    required_error: 'نوع المحتوى مطلوب',
  }),
  contentUrl: z
    .string()
    .min(1, 'رابط المحتوى مطلوب')
    .url('يجب إدخال رابط صالح يبدأ بـ http:// أو https://')
    .refine(
      (val) => val.startsWith('http://') || val.startsWith('https://'),
      'الرابط يجب أن يبدأ بـ http:// أو https://'
    ),
  isPublished: z.boolean().default(true),
});

export type LessonFormData = z.infer<typeof lessonSchema>;
