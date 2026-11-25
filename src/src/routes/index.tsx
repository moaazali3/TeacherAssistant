import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getTenantMode, useTenantSlug, platformPath } from '@/lib/tenant';

// Layouts
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { TenantLayout } from '@/layouts/TenantLayout';
import { PageFallback } from '@/components/ui/PageFallback';

// Protected Route Guard
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { ASSISTANT_PERMISSIONS } from '@/features/auth/types';

// Lazy-loaded Pages — Platform & Public
const PlatformLandingPage = lazy(() =>
  import('@/pages/PlatformLandingPage').then((m) => ({ default: m.PlatformLandingPage }))
);
const TeacherRegisterPage = lazy(() =>
  import('@/features/auth/pages/TeacherRegisterPage').then((m) => ({ default: m.TeacherRegisterPage }))
);
const TeacherLoginPage = lazy(() =>
  import('@/features/auth/pages/TeacherLoginPage').then((m) => ({ default: m.TeacherLoginPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// Lazy-loaded Pages — Teacher Control Panel
const TeacherDashboardPage = lazy(() =>
  import('@/features/tenant/pages/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage }))
);
const BrandingSettingsPage = lazy(() =>
  import('@/features/tenant/pages/BrandingSettingsPage').then((m) => ({ default: m.BrandingSettingsPage }))
);
const LandingEditorPage = lazy(() =>
  import('@/features/landing/pages/LandingEditorPage').then((m) => ({ default: m.LandingEditorPage }))
);
const TeacherSubjectsPage = lazy(() =>
  import('@/features/subjects/pages/TeacherSubjectsPage').then((m) => ({ default: m.TeacherSubjectsPage }))
);
const SubjectEditorPage = lazy(() =>
  import('@/features/subjects/pages/SubjectEditorPage').then((m) => ({ default: m.SubjectEditorPage }))
);
const SubjectManagerPage = lazy(() =>
  import('@/features/subjects/pages/SubjectManagerPage').then((m) => ({ default: m.SubjectManagerPage }))
);
const AssistantsPage = lazy(() =>
  import('@/features/assistants/pages/AssistantsPage').then((m) => ({ default: m.AssistantsPage }))
);
const StudentsTrackingPage = lazy(() =>
  import('@/features/students/pages/StudentsTrackingPage').then((m) => ({ default: m.StudentsTrackingPage }))
);
const SubjectQuizzesPage = lazy(() =>
  import('@/features/quizzes/pages/SubjectQuizzesPage').then((m) => ({ default: m.SubjectQuizzesPage }))
);
const QuizTakePage = lazy(() =>
  import('@/features/quizzes/pages/QuizTakePage').then((m) => ({ default: m.QuizTakePage }))
);
const SubjectGroupsPage = lazy(() =>
  import('@/features/groups/pages/SubjectGroupsPage').then((m) => ({ default: m.SubjectGroupsPage }))
);

// Lazy-loaded Pages — Tenant (Student View Only)
const TenantHomePage = lazy(() =>
  import('@/features/tenant/pages/TenantHomePage').then((m) => ({ default: m.TenantHomePage }))
);
const StudentLoginPage = lazy(() =>
  import('@/features/auth/pages/StudentLoginPage').then((m) => ({ default: m.StudentLoginPage }))
);
const StudentRegisterPage = lazy(() =>
  import('@/features/auth/pages/StudentRegisterPage').then((m) => ({ default: m.StudentRegisterPage }))
);
const PublicSubjectsPage = lazy(() =>
  import('@/features/subjects/pages/PublicSubjectsPage').then((m) => ({ default: m.PublicSubjectsPage }))
);
const SubjectDetailPage = lazy(() =>
  import('@/features/subjects/pages/SubjectDetailPage').then((m) => ({ default: m.SubjectDetailPage }))
);
const LessonViewerPage = lazy(() =>
  import('@/features/subjects/pages/LessonViewerPage').then((m) => ({ default: m.LessonViewerPage }))
);
const MySubjectsPage = lazy(() =>
  import('@/features/groups/pages/MySubjectsPage').then((m) => ({ default: m.MySubjectsPage }))
);

// Redirect component for teacher routes accessed from tenant site
const RedirectToPlatform: React.FC<{ path: string }> = ({ path }) => {
  React.useEffect(() => {
    window.location.href = platformPath(path);
  }, [path]);
  return null;
};

export const AppRoutes: React.FC = () => {
  const mode = getTenantMode();
  const slug = useTenantSlug();

  // 1. TENANT SITE ROUTES (Strictly Student View-Only)
  const renderTenantRoutes = () => (
    <>
      <Route index element={<TenantHomePage />} />
      <Route path="login" element={<StudentLoginPage />} />
      <Route path="register" element={<StudentRegisterPage />} />

      {/* Teacher login on tenant redirects to platform site */}
      <Route path="teacher/login" element={<RedirectToPlatform path="/teacher/login" />} />
      <Route path="dashboard/teacher/*" element={<RedirectToPlatform path="/dashboard/teacher" />} />

      {/* Public / Student Subjects & Lessons Exploration */}
      <Route path="subjects" element={<PublicSubjectsPage />} />
      <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
      <Route
        path="subjects/:subjectId/lessons/:lessonId"
        element={
          <ProtectedRoute>
            <LessonViewerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="subjects/:subjectId/quizzes/:quizId"
        element={
          <ProtectedRoute>
            <QuizTakePage />
          </ProtectedRoute>
        }
      />

      {/* Protected Student Routes */}
      <Route
        path="my-subjects"
        element={
          <ProtectedRoute requiredRole="Student">
            <MySubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route path="dashboard/student" element={<Navigate to="../my-subjects" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </>
  );

  // 2. PLATFORM SITE ROUTES (Platform Info + Teacher Control Panel)
  const renderPlatformRoutes = () => (
    <>
      <Route index element={<PlatformLandingPage />} />
      <Route path="register" element={<TeacherRegisterPage />} />
      <Route path="register-teacher" element={<Navigate to="/register" replace />} />
      <Route path="teacher/login" element={<TeacherLoginPage />} />
      <Route path="login" element={<Navigate to="/teacher/login" replace />} />

      {/* Protected Teacher Control Panel */}
      <Route
        path="dashboard/teacher"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/branding"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <BrandingSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/landing"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <LandingEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/subjects"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <TeacherSubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/subjects/new"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <SubjectEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/subjects/:subjectId"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <SubjectManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/subjects/:subjectId/edit"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <SubjectEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/subjects/:subjectId/groups"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <SubjectGroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/subjects/:subjectId/quizzes"
        element={
          <ProtectedRoute
            allowedRoles={['Instructor', 'Assistant']}
            requiredPermission={ASSISTANT_PERMISSIONS.MANAGE_ASSESSMENTS}
          >
            <SubjectQuizzesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/students"
        element={
          <ProtectedRoute
            allowedRoles={['Instructor', 'Assistant']}
            requiredPermission={ASSISTANT_PERMISSIONS.VIEW_STUDENT_PROGRESS}
          >
            <StudentsTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/teacher/assistants"
        element={
          <ProtectedRoute requiredRole="Instructor">
            <AssistantsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </>
  );

  // 1. SUBDOMAIN MODE (e.g. ahmed.localhost:5173 vs localhost:5173)
  if (mode === 'subdomain') {
    // Inside a tenant subdomain (e.g. ahmed.localhost:5173) -> Student View
    if (slug) {
      return (
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<TenantLayout />}>
              {renderTenantRoutes()}
            </Route>
          </Routes>
        </Suspense>
      );
    }

    // Platform root host (e.g. localhost:5173) -> Control Panel
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<PlatformLayout />}>
            {renderPlatformRoutes()}
          </Route>
        </Routes>
      </Suspense>
    );
  }

  // 2. PATH MODE (e.g. /t/:slug vs /)
  // Tenant routes and Platform routes are clean SIBLINGS so neither navbar ever nests inside the other.
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Tenant routes in path mode: strictly TenantLayout ONLY */}
        <Route path="t/:slug" element={<TenantLayout />}>
          {renderTenantRoutes()}
        </Route>

        {/* Platform routes: strictly PlatformLayout ONLY */}
        <Route element={<PlatformLayout />}>
          {renderPlatformRoutes()}
        </Route>
      </Routes>
    </Suspense>
  );
};
