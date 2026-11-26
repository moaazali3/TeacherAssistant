import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTenant } from '@/features/tenant/useTenant';
import { useAuth } from '@/features/auth/useAuth';
import { tenantPath, platformPath } from '@/lib/tenant';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TenantNotFoundPage } from '@/features/tenant/pages/TenantNotFoundPage';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from '@/components/ui/Dropdown';
import {
  BookOpen,
  UserPlus,
  LogIn,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export const TenantLayout: React.FC = () => {
  const { tenant, isLoading, isNotFound } = useTenant();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // State for mobile hamburger menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for Join Group Modal
  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-sm font-medium text-text-muted">جاري تحميل المنصة التعليمية...</p>
      </div>
    );
  }

  if (isNotFound) {
    return <TenantNotFoundPage />;
  }

  const isStudent = isAuthenticated && user?.role === 'Student';
  const isTeacher = isAuthenticated && (user?.role === 'Instructor' || user?.role === 'Admin');

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-main">
      {/* Teacher notice bar if teacher is logged in visiting tenant site */}
      {isTeacher && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs text-center flex items-center justify-center gap-2 text-text-main">
          <span>أنت تتصفح منصتك كطالب/زائر (عرض فقط). لإدارة المواد والمجموعات والطلاب:</span>
          <a
            href={platformPath('/dashboard/teacher')}
            className="text-primary font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>فتح لوحة تحكم المعلم</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Teacher's Themed Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <Link to={tenantPath('/')} className="flex items-center gap-3 group shrink-0">
            {tenant?.logoUrl ? (
              <div className="w-10 h-10 rounded-full border border-border overflow-hidden bg-surface shrink-0 group-hover:border-primary/50 transition-colors">
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg font-heading shrink-0 shadow-xs">
                {(tenant?.name || 'م').charAt(0)}
              </div>
            )}
            <div className="text-start">
              <span className="text-base font-extrabold font-heading text-text-main block leading-tight group-hover:text-primary transition-colors">
                {tenant?.name || 'المنصة التعليمية'}
              </span>
              <span className="text-xs text-text-muted font-medium block">
                المنصة التعليمية
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link
              to={tenantPath('/')}
              className={`font-medium transition-colors ${
                location.pathname === tenantPath('/')
                  ? 'text-primary font-bold'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              الرئيسية
            </Link>

            {!isStudent && (
              <Link
                to={tenantPath('/subjects')}
                className={`font-medium transition-colors ${
                  location.pathname.startsWith(tenantPath('/subjects'))
                    ? 'text-primary font-bold'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                المواد
              </Link>
            )}

            {isStudent && (
              <Link
                to={tenantPath('/my-subjects')}
                className={`font-medium transition-colors ${
                  location.pathname === tenantPath('/my-subjects') ||
                  location.pathname.startsWith(tenantPath('/subjects'))
                    ? 'text-primary font-bold'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                موادي
              </Link>
            )}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isStudent && user ? (
              /* Logged In State (Student only) using Radix Dropdown */
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center font-heading">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-text-main max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <Badge variant="neutral" size="sm">
                      طالب
                    </Badge>
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </button>
                </DropdownTrigger>

                <DropdownContent align="end" className="w-56">
                  <DropdownLabel>
                    <p className="font-bold text-text-main truncate">{user.name}</p>
                    <p className="text-xs text-text-muted font-normal truncate mt-0.5">{user.email}</p>
                  </DropdownLabel>

                  <DropdownSeparator />

                  <DropdownItem asChild>
                    <Link to={tenantPath('/my-subjects')} className="w-full">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>موادي الدراسية</span>
                    </Link>
                  </DropdownItem>

                  <DropdownItem onClick={() => setIsJoinGroupModalOpen(true)}>
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span>الانضمام لجروب آخر</span>
                  </DropdownItem>

                  <DropdownSeparator />

                  <DropdownItem variant="danger" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            ) : (
              /* Logged Out State or Teacher visiting tenant site */
              <div className="flex items-center gap-2.5">
                <Link to={tenantPath('/login')}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold"
                    startIcon={<LogIn className="w-4 h-4" />}
                  >
                    تسجيل الدخول
                  </Button>
                </Link>

                <Link to={tenantPath('/register')}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold"
                    startIcon={<UserPlus className="w-4 h-4" />}
                  >
                    إنشاء حساب
                  </Button>
                </Link>

                {isTeacher && (
                  <a
                    href={platformPath('/dashboard/teacher')}
                    className="text-xs text-text-muted hover:text-primary transition-colors ms-1 font-medium flex items-center gap-1"
                    title="الذهاب للوحة التحكم بالمنصة الرئيسية"
                  >
                    <span>لوحة التحكم</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="القائمة الرئيسية"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 text-start">
            {/* Primary Nav Links */}
            <div className="flex flex-col space-y-1 pb-3 border-b border-border-subtle">
              <Link
                to={tenantPath('/')}
                className="px-3 py-2 rounded-lg font-medium text-text-main hover:bg-surface-hover hover:text-primary transition-colors"
              >
                الرئيسية
              </Link>
              {!isStudent && (
                <Link
                  to={tenantPath('/subjects')}
                  className="px-3 py-2 rounded-lg font-medium text-text-main hover:bg-surface-hover hover:text-primary transition-colors"
                >
                  المواد
                </Link>
              )}
              {isStudent && (
                <Link
                  to={tenantPath('/my-subjects')}
                  className="px-3 py-2 rounded-lg font-medium text-text-main hover:bg-surface-hover hover:text-primary transition-colors"
                >
                  موادي
                </Link>
              )}
            </div>

            {/* Auth Actions in Mobile */}
            {isStudent && user ? (
              <div className="space-y-3">
                {/* User info banner */}
                <div className="px-3 py-2.5 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-main">{user.name}</p>
                    <p className="text-xs text-text-muted">{user.email}</p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    طالب
                  </Badge>
                </div>

                <div className="flex flex-col space-y-1">
                  <Link
                    to={tenantPath('/my-subjects')}
                    className="px-3 py-2 rounded-lg text-sm font-bold text-text-main hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>موادي الدراسية</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsJoinGroupModalOpen(true);
                    }}
                    className="w-full text-start px-3 py-2 rounded-lg text-sm font-medium text-text-main hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span>الانضمام لجروب آخر بكود</span>
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  startIcon={<LogOut className="w-4 h-4" />}
                  className="w-full text-danger border-danger/30 hover:bg-danger-bg"
                >
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-1">
                <Link to={tenantPath('/login')} className="w-full">
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full font-bold"
                    startIcon={<LogIn className="w-4 h-4" />}
                  >
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to={tenantPath('/register')} className="w-full">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-bold"
                    startIcon={<UserPlus className="w-4 h-4" />}
                  >
                    إنشاء حساب
                  </Button>
                </Link>
                {isTeacher && (
                  <div className="text-center pt-2 border-t border-border-subtle">
                    <a
                      href={platformPath('/dashboard/teacher')}
                      className="text-xs text-text-muted hover:text-primary underline inline-flex items-center gap-1"
                    >
                      <span>فتح لوحة تحكم المعلم (المنصة الرئيسية)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Themed Tenant Footer */}
      <footer className="bg-surface border-t border-border mt-auto py-8 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            منصة {tenant?.name} © {new Date().getFullYear()} — جميع الحقوق محفوظة
          </p>

          <div className="flex items-center gap-4">
            <Link
              to={tenantPath('/subjects')}
              className="hover:text-primary transition-colors"
            >
              جميع المواد
            </Link>
            <span>•</span>
            <p className="flex items-center gap-1.5">
              <span>مشغل بواسطة</span>
              <a href={platformPath('/')} className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                <img src="/logo.svg" alt="طرابيزة" className="w-4 h-4 rounded-xs" />
                <span>طرابيزة Tarabeza</span>
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Join Group Modal for Students */}
      <JoinGroupModal
        isOpen={isJoinGroupModalOpen}
        onClose={() => setIsJoinGroupModalOpen(false)}
      />
    </div>
  );
};
