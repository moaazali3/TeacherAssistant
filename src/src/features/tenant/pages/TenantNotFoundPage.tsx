import React from 'react';
import { useTenantSlug, buildPlatformUrl } from '@/lib/tenant';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Sparkles, Home } from 'lucide-react';

export const TenantNotFoundPage: React.FC = () => {
  const slug = useTenantSlug();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 sm:p-10 text-center shadow-lg animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto mb-6 shadow-xs">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black text-text-main font-heading mb-2">
          المنصة غير موجودة
        </h1>

        <p className="text-sm text-text-muted mb-4 leading-relaxed">
          عذراً، لم نتمكن من العثور على أي منصة تعليمية مسجلة بالنطاق الفرعي:{' '}
          <span className="font-mono font-bold text-danger bg-danger-bg px-2 py-0.5 rounded-md">
            {slug || 'غير محدد'}
          </span>
        </p>

        <p className="text-xs text-text-subtle mb-8 leading-relaxed">
          تأكد من كتابة الرابط بشكل صحيح، أو يمكنك إنشاء منصتك الخاصة خلال دقائق.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold"
            startIcon={<Sparkles className="w-4 h-4" />}
            onClick={() => {
              window.location.href = buildPlatformUrl('/register');
            }}
          >
            إنشاء منصتك التعليمية الآن
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full"
            startIcon={<Home className="w-4 h-4" />}
            onClick={() => {
              window.location.href = buildPlatformUrl('/');
            }}
          >
            الذهاب إلى الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};
