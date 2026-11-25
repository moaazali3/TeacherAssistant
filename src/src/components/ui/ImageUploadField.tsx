import React, { useRef, useState } from 'react';
import { apiClient, ApiResponse, getApiErrorMessage } from '@/lib/api';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UploadedImageResponse {
  url: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  folder?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  previewAspect?: 'square' | 'video';
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  folder = 'images',
  placeholder = 'https://... أو ارفع صورة من جهازك',
  helperText = 'ارفع صورة (JPG, PNG, WebP بحد أقصى 5 ميجابايت) أو الصق رابطاً مباشراً.',
  error,
  previewAspect = 'video',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { success, error: toastError } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      toastError('نوع الملف غير مدعوم. اختر صورة بصيغة JPG أو PNG أو WebP أو GIF.');
      return;
    }

    if (file.size > MAX_BYTES) {
      toastError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      setIsUploading(true);
      const res = await apiClient.post<ApiResponse<UploadedImageResponse>>(
        '/media/upload-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const uploadedUrl = res.data.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        success('تم رفع الصورة بنجاح!');
      }
    } catch (err) {
      toastError(getApiErrorMessage(err, 'تعذر رفع الصورة. حاول مرة أخرى.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2.5 text-start">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <div className="flex-1">
          <Input
            label={label}
            type="text"
            dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            error={error}
            className="text-start font-mono text-xs"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelected}
        />

        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 font-bold"
          startIcon={
            isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )
          }
        >
          {isUploading ? 'جاري الرفع...' : 'رفع صورة'}
        </Button>
      </div>

      {helperText && !error && (
        <p className="text-xs text-text-muted">{helperText}</p>
      )}

      {value ? (
        <div
          className={`relative rounded-xl overflow-hidden border border-border bg-surface-subtle ${
            previewAspect === 'square' ? 'w-28 h-28' : 'w-48 aspect-video'
          }`}
        >
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-surface/90 border border-border text-danger flex items-center justify-center shadow-xs hover:bg-danger-bg"
            title="إزالة الصورة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-text-subtle">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>لم يتم اختيار صورة بعد</span>
        </div>
      )}
    </div>
  );
};
