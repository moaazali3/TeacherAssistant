import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonSchema, LessonFormData } from '../schemas';
import { LessonSummary, LessonDetail, ContentType, CONTENT_TYPE_LABELS, normalizeContentType } from '../types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { applyServerValidationErrors } from '@/lib/api';
import { BookOpen, Video, FileText, Link as LinkIcon, File, FolderOpen, Paperclip, CalendarClock, Lock } from 'lucide-react';

function toLocalDateTimeInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LessonFormData) => Promise<void>;
  initialData?: LessonSummary | LessonDetail | null;
  isLoading?: boolean;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      contentType: 'Video',
      contentUrl: '',
      isPublished: true,
      moduleTitle: '',
      availableAt: '',
      requiresPreviousCompletion: false,
      attachmentUrl: '',
    },
    mode: 'onTouched',
  });

  const selectedContentType = watch('contentType');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title || '',
          description: initialData.description || '',
          contentType: normalizeContentType(initialData.contentType),
          contentUrl: 'contentUrl' in initialData ? (initialData as LessonDetail).contentUrl : '',
          isPublished: initialData.isPublished ?? true,
          moduleTitle: initialData.moduleTitle || '',
          availableAt: toLocalDateTimeInput(initialData.availableAt),
          requiresPreviousCompletion: initialData.requiresPreviousCompletion ?? false,
          attachmentUrl: initialData.attachmentUrl || '',
        });
      } else {
        reset({
          title: '',
          description: '',
          contentType: 'Video',
          contentUrl: '',
          isPublished: true,
          moduleTitle: '',
          availableAt: '',
          requiresPreviousCompletion: false,
          attachmentUrl: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const contentTypes: ContentType[] = ['Video', 'Pdf', 'Word', 'Article', 'Link'];

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'Video':
        return <Video className="w-3.5 h-3.5" />;
      case 'Pdf':
      case 'Word':
      case 'Article':
        return <FileText className="w-3.5 h-3.5" />;
      case 'Link':
        return <LinkIcon className="w-3.5 h-3.5" />;
      default:
        return <File className="w-3.5 h-3.5" />;
    }
  };

  const getUrlPlaceholder = () => {
    switch (selectedContentType) {
      case 'Video':
        return 'https://www.youtube.com/watch?v=...';
      case 'Pdf':
        return 'https://drive.google.com/file/d/... أو https://example.com/file.pdf';
      default:
        return 'https://...';
    }
  };

  const handleFormSubmit = async (data: LessonFormData) => {
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      applyServerValidationErrors(err, setError);
      throw err;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>{isEditing ? 'تعديل بيانات الدرس' : 'إضافة درس جديد'}</span>
        </div>
      }
      showCloseButton={!isLoading}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Title */}
        <Input
          label="عنوان الدرس"
          required
          placeholder="مثال: مقدمة في الكيمياء العضوية"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Description */}
        <div className="text-start">
          <label className="block text-sm font-medium text-text-main mb-1.5 select-none">
            وصف الدرس (اختياري)
          </label>
          <textarea
            rows={3}
            placeholder="أدخل ملخصاً أو نقاط الدرس الأساسية..."
            className="w-full bg-surface text-text-main border border-border rounded-md px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-subtle"
            {...register('description')}
          />
          {errors.description?.message && (
            <p className="mt-1.5 text-xs text-danger font-medium">{errors.description.message}</p>
          )}
        </div>

        {/* Content Type Picker */}
        <div className="text-start">
          <label className="block text-sm font-medium text-text-main mb-1.5 select-none">
            نوع المحتوى التعليمي <span className="text-danger ms-1">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {contentTypes.map((type) => {
              const isSelected = selectedContentType === type;
              return (
                <label
                  key={type}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border bg-surface hover:bg-surface-subtle text-text-muted hover:text-text-main'
                  }`}
                >
                  <input
                    type="radio"
                    value={type}
                    className="sr-only"
                    {...register('contentType')}
                  />
                  <div className="mb-1">{getTypeIcon(type)}</div>
                  <span>{CONTENT_TYPE_LABELS[type]}</span>
                </label>
              );
            })}
          </div>
          {errors.contentType?.message && (
            <p className="mt-1.5 text-xs text-danger font-medium">{errors.contentType.message}</p>
          )}
        </div>

        {/* Content URL */}
        <Input
          label="رابط المحتوى (URL)"
          required
          type="url"
          dir="ltr"
          className="text-start font-mono text-xs"
          placeholder={getUrlPlaceholder()}
          error={errors.contentUrl?.message}
          helperText="يدعم روابط اليوتيوب (YouTube)، ملفات جوجل درايف (Google Drive)، أو روابط الـ PDF المباشرة."
          {...register('contentUrl')}
        />

        {/* Module / Chapter + Handout Attachment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="الباب / الشهر (اختياري)"
            placeholder="مثال: الشهر الأول - العناصر الانتقالية"
            startAdornment={<FolderOpen className="w-4 h-4 text-text-subtle" />}
            error={errors.moduleTitle?.message}
            {...register('moduleTitle')}
          />

          <Input
            label="موعد الفتح المجدول (اختياري)"
            type="datetime-local"
            dir="ltr"
            startAdornment={<CalendarClock className="w-4 h-4 text-text-subtle" />}
            error={errors.availableAt?.message}
            {...register('availableAt')}
          />
        </div>

        <Input
          label="رابط ملزمة PDF مرفقة (اختياري)"
          type="url"
          dir="ltr"
          className="text-start font-mono text-xs"
          placeholder="https://drive.google.com/..."
          startAdornment={<Paperclip className="w-4 h-4 text-text-subtle" />}
          error={errors.attachmentUrl?.message}
          {...register('attachmentUrl')}
        />

        {/* Published & Sequential Lock Toggles */}
        <div className="pt-1 space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
              {...register('isPublished')}
            />
            <span className="text-sm font-medium text-text-main">
              نشر الدرس للطلاب مباشرة
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
              {...register('requiresPreviousCompletion')}
            />
            <span className="text-sm font-medium text-text-main flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-text-muted" />
              <span>قفل المحاضرة لحين إتمام الطالب للمحاضرة السابقة</span>
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="font-bold"
          >
            {isEditing ? 'حفظ التعديلات' : 'إضافة الدرس'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
