import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectSchema, SubjectFormData } from '../schemas';
import { SubjectDetail, SubjectSummary } from '../types';
import { Input } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { applyServerValidationErrors } from '@/lib/api';

interface SubjectFormProps {
  initialData?: SubjectDetail | SubjectSummary;
  onSubmit: (data: SubjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      thumbnailUrl: initialData?.thumbnailUrl || '',
      isPublished: initialData ? initialData.isPublished : true,
    },
    mode: 'onTouched',
  });

  const watchedThumbnail = watch('thumbnailUrl');

  const handleFormSubmit = async (data: SubjectFormData) => {
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      applyServerValidationErrors(err, setError);
      throw err;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card className="max-w-3xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            {isEditing ? 'تعديل بيانات المادة' : 'إنشاء مادة تعليمي جديد'}
          </CardTitle>
          <CardDescription>
            أدخل عنوان المقرر، الوصف التعريفي، ورابط صورة الغلاف التي ستظهر للطلاب.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Title */}
          <Input
            label="عنوان المادة"
            required
            placeholder="مثال: شرح الفيزياء للثانوية العامة - الفصل الأول"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Description */}
          <div className="text-start">
            <label className="block text-sm font-medium text-text-main mb-1.5 select-none">
              وصف المادة
            </label>
            <textarea
              rows={4}
              placeholder="اكتب نبذة مختصرة عن أهداف المادة والموضوعات التي سيتم تغطيتها..."
              className="w-full bg-surface text-text-main border border-border rounded-md px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-subtle"
              {...register('description')}
            />
            {errors.description?.message && (
              <p className="mt-1.5 text-xs text-danger font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Thumbnail Upload or URL */}
          <ImageUploadField
            label="صورة غلاف المادة"
            folder="subjects"
            value={watchedThumbnail || ''}
            onChange={(url) =>
              setValue('thumbnailUrl', url, { shouldDirty: true, shouldValidate: true })
            }
            error={errors.thumbnailUrl?.message}
            helperText="ارفع غلاف المادة على السيرفر أو الصق رابط صورة مباشر (JPG, PNG, WebP)."
          />

          {/* Published Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
                {...register('isPublished')}
              />
              <div>
                <span className="block text-sm font-medium text-text-main">
                  نشر المادة مباشرة للطلاب
                </span>
                <span className="block text-xs text-text-muted">
                  إذا لم يتم تفعيل هذا الخيار، سيظل المادة كـ «مسودة» مرئية لك فقط حتى تقرر نشره.
                </span>
              </div>
            </label>
          </div>
        </CardContent>

        <CardFooter className="pt-4 flex items-center justify-between">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading || (!isDirty && isEditing)}
          >
            {isEditing ? 'حفظ التعديلات' : 'إنشاء المادة الآن'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            إلغاء
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
