import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { UserRole } from './types';
import { tenantPath, platformPath } from '@/lib/tenant';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-sm text-text-muted">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // If route requires Instructor role, direct to teacher login on platform; otherwise student login on tenant
    const targetLogin = requiredRole === 'Instructor' ? platformPath('/teacher/login') : tenantPath('/login');
    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  const isInstructor = user.role === 'Instructor' || user.role === 'Admin';
  const isStudent = user.role === 'Student';

  const roleMatches =
    !requiredRole ||
    (requiredRole === 'Instructor' && isInstructor) ||
    (requiredRole === 'Student' && isStudent) ||
    user.role === 'Admin';

  if (!roleMatches) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-border">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-warning-bg text-warning flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle>غير مصرح بالدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يتطلب هذا القسم حساب من نوع ({requiredRole === 'Instructor' ? 'معلم' : 'طالب'}).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  const redirectTarget = isInstructor ? platformPath('/dashboard/teacher') : tenantPath('/my-subjects');
                  window.location.href = redirectTarget;
                }}
              >
                العودة للوحة التحكم
              </Button>
              <Button variant="outline" onClick={logout} startIcon={<LogOut className="w-4 h-4" />}>
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
