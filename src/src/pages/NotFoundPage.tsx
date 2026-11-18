import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useTenantSlug, tenantPath, platformPath } from '@/lib/tenant';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const slug = useTenantSlug();
  const homePath = slug ? tenantPath('/') : platformPath('/');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl font-black text-primary font-heading mb-2">404</div>
        <h2 className="text-2xl font-bold text-text-main mb-3">الصفحة غير موجودة</h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link to={homePath}>
          <Button variant="primary" startIcon={<Home className="w-4 h-4" />}>
            العودة للصفحة الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
};
