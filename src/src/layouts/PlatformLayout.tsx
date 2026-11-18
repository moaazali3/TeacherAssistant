import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from '@/components/ui/Dropdown';
import { buildTenantFullUrl, platformPath } from '@/lib/tenant';
import { useAuth } from '@/features/auth/useAuth';
import {
  GraduationCap,
  Search,
  ExternalLink,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  Palette,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const PlatformLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [platformSlug, setPlatformSlug] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isTeacher = isAuthenticated && (user?.role === 'Instructor' || user?.role === 'Admin');

  const handleNavigateToTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = platformSlug.trim().toLowerCase();
    if (!trimmed) return;
    const targetUrl = buildTenantFullUrl(trimmed, '/');
    window.location.href = targetUrl;
  };

  const studentPlatformUrl = user?.tenantSubdomain ? buildTenantFullUrl(user.tenantSubdomain, '/') : '';

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-main">
      {/* Platform Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to={platformPath('/')} className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-start">
              <span className="text-lg font-black font-heading text-text-main tracking-tight block leading-tight">
                المساعد التعليمي
              </span>
              <span className="text-xs text-text-muted font-medium block">
                {isTeacher ? 'لوحة تحكم المعلم' : 'منصة تعليمية متكاملة'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            {isTeacher ? (
              <>
                <Link
                  to={platformPath('/dashboard/teacher')}
                  className="hover:text-primary transition-colors font-bold text-text-main"
                >
                  لوحة التحكم
                </Link>
                <Link
                  to={platformPath('/dashboard/teacher/subjects')}
                  className="hover:text-primary transition-colors"
                >
                  المواد الدراسية
                </Link>
                <Link
                  to={platformPath('/dashboard/teacher/branding')}
                  className="hover:text-primary transition-colors"
                >
                  المظهر والهوية
                </Link>
              </>
            ) : (
              <>
                <Link to={platformPath('/')} className="hover:text-primary transition-colors">
                  الرئيسية
                </Link>
                <a href="#features" className="hover:text-primary transition-colors">
                  المميزات
                </a>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  كيف تعمل المنصة؟
                </a>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isTeacher ? (
              <div className="flex items-center gap-3">
                {studentPlatformUrl && (
                  <a href={studentPlatformUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-bold text-xs"
                      endIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      موقع الطلاب
                    </Button>
                  </a>
                )}

                {/* Radix Dropdown User Menu */}
                <Dropdown>
                  <DropdownTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center font-heading">
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-start">
                        <span className="text-xs font-bold text-text-main block truncate max-w-[120px]">
                          {user?.name}
                        </span>
                      </div>
                      <Badge variant="primary" size="sm">
                        معلم
                      </Badge>
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    </button>
                  </DropdownTrigger>

                  <DropdownContent align="end" className="w-56">
                    <DropdownLabel>
                      <p className="font-bold text-text-main truncate">{user?.name}</p>
                      <p className="text-xs text-text-muted font-normal truncate mt-0.5">{user?.email}</p>
                    </DropdownLabel>

                    <DropdownSeparator />

                    <DropdownItem asChild>
                      <Link to={platformPath('/dashboard/teacher')} className="w-full">
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        <span>لوحة التحكم</span>
                      </Link>
                    </DropdownItem>

                    <DropdownItem asChild>
                      <Link to={platformPath('/dashboard/teacher/subjects')} className="w-full">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>المواد الدراسية</span>
                      </Link>
                    </DropdownItem>

                    <DropdownItem asChild>
                      <Link to={platformPath('/dashboard/teacher/branding')} className="w-full">
                        <Palette className="w-4 h-4 text-primary" />
                        <span>المظهر والهوية</span>
                      </Link>
                    </DropdownItem>

                    {studentPlatformUrl && (
                      <DropdownItem asChild>
                        <a href={studentPlatformUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                          <ExternalLink className="w-4 h-4 text-primary" />
                          <span>زيارة موقع الطلاب</span>
                        </a>
                      </DropdownItem>
                    )}

                    <DropdownSeparator />

                    <DropdownItem variant="danger" onClick={logout}>
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFindModalOpen(true)}
                  className="text-sm font-medium text-text-muted hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-hover flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4 text-text-subtle" />
                  <span>دخول منصة معلم</span>
                </button>

                <Link to={platformPath('/teacher/login')}>
                  <Button variant="outline" size="sm" className="font-bold">
                    تسجيل دخول المدرس
                  </Button>
                </Link>

                <Link to={platformPath('/register')}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold"
                    startIcon={<Sparkles className="w-4 h-4" />}
                  >
                    أنشئ منصتك
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
              aria-label="القائمة الرئيسية"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 text-start shadow-md animate-in fade-in duration-150">
            {isTeacher ? (
              <div className="space-y-3">
                <div className="p-3 bg-surface-subtle border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-main">{user?.name}</p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>
                  <Badge variant="primary" size="sm">معلم</Badge>
                </div>

                <div className="flex flex-col space-y-1">
                  <Link
                    to={platformPath('/dashboard/teacher')}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg font-bold text-text-main hover:bg-surface-hover hover:text-primary flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <span>لوحة التحكم</span>
                  </Link>
                  <Link
                    to={platformPath('/dashboard/teacher/subjects')}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg font-medium text-text-main hover:bg-surface-hover hover:text-primary flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>المواد الدراسية</span>
                  </Link>
                  <Link
                    to={platformPath('/dashboard/teacher/branding')}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg font-medium text-text-main hover:bg-surface-hover hover:text-primary flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4 text-primary" />
                    <span>المظهر والهوية</span>
                  </Link>
                  {studentPlatformUrl && (
                    <a
                      href={studentPlatformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg font-medium text-primary hover:bg-surface-hover flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>زيارة موقع الطلاب</span>
                    </a>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  startIcon={<LogOut className="w-4 h-4" />}
                  className="w-full text-danger border-danger/30 hover:bg-danger-bg"
                >
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <>
                <Link
                  to={platformPath('/')}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg font-medium text-text-main hover:bg-surface-hover"
                >
                  الرئيسية
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsFindModalOpen(true);
                  }}
                  className="w-full text-start px-3 py-2 rounded-lg font-medium text-text-muted hover:text-primary hover:bg-surface-hover flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-text-subtle" />
                  <span>دخول منصة معلم</span>
                </button>
                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  <Link to={platformPath('/teacher/login')} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full font-bold">
                      تسجيل دخول المدرس
                    </Button>
                  </Link>
                  <Link to={platformPath('/register')} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full font-bold"
                      startIcon={<Sparkles className="w-4 h-4" />}
                    >
                      أنشئ منصتك
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Platform Footer */}
      <footer className="bg-surface border-t border-border mt-auto py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-heading text-text-main">
                منصة المساعد التعليمي
              </span>
              <span className="text-xs text-text-muted">
                — الجيل الجديد من المنصات التعليمية المستقلة للمعلمين
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-text-muted">
              <button
                type="button"
                onClick={() => setIsFindModalOpen(true)}
                className="hover:text-primary transition-colors underline"
              >
                البحث عن منصة معلم
              </button>
              <span>•</span>
              <Link to={platformPath('/teacher/login')} className="hover:text-primary transition-colors underline">
                دخول المدرس
              </Link>
              <span>•</span>
              <Link to={platformPath('/register')} className="hover:text-primary transition-colors underline">
                إنشاء منصة
              </Link>
              <span>•</span>
              <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Find Teacher Platform Modal with Radix Modal */}
      <Modal
        isOpen={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
        size="sm"
        title={
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <span>الانتقال إلى منصة معلم</span>
          </div>
        }
        description="إذا كنت طالباً ولديك اسم منصة أستاذك (النطاق الفرعي)، أدخله هنا للانتقال إليها مباشرة والتسجيل بكود مجموعتك."
      >
        <form onSubmit={handleNavigateToTenant} className="space-y-4">
          <div>
            <Input
              label="نطاق منصة المعلم (Subdomain)"
              placeholder="مثال: ahmed"
              dir="ltr"
              value={platformSlug}
              onChange={(e) => setPlatformSlug(e.target.value)}
              className="font-mono text-start"
              required
              autoFocus
            />
            <span className="text-xs text-text-muted mt-1.5 block">
              سيتم التوجيه إلى: <code className="text-primary font-mono">{platformSlug.trim() || 'name'}.localhost:5173</code>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFindModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!platformSlug.trim()}
              className="font-bold"
              endIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-0" />}
            >
              انتقال للمنصة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
