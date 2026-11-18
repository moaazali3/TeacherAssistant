# GAPS.md — Gap review

Read-only review of the current solution (ASP.NET Core API + EF Core + React/Vite).
No code was changed for this report. Effort: **S** ≤ ½ day, **M** = 1–3 days, **L** > 3 days.

---

## 1. Half-built or inconsistent

| # | Item | What is missing / inconsistent | Effort | Files it would touch |
|---|------|--------------------------------|--------|----------------------|
| 1 | **Payments & enrollment are stubs** | `PaymentService.CheckoutAsync` returns a fake Stripe URL and never creates an `Enrollment` or `PaymentTransaction`. The webhook ignores its payload. `Subject.Price`, `Enrollment`, `PaymentTransaction`, `EnrollmentStatus`, `PaymentStatus` and the `Enrollments`/`PaymentTransactions` DbSets are otherwise unused. `CheckoutRequestDto.SubjectId` is never read. No payment/enrollment UI exists. | **L** | `src/TeacherAssistant.Infrastructure/Services/Payments/PaymentService.cs`, `src/TeacherAssistant.API/Controllers/PaymentsController.cs`, `.../DTOs/Payments/*`, `.../Domain/Entities/Enrollment.cs`, `PaymentTransaction.cs`, `Subject.cs`, `src/src/features/subjects/**` |
| 2 | **AI quizzes are stubs** | `OpenAiAssessmentService` returns one hard-coded question and a score of 10; `Quiz` and `Submission` are never persisted. `GenerateQuizRequestDto.SubjectId/LessonId/FileStream` are unused; `QuizDto.QuestionsData` exposes raw JSON. No quiz authoring or taking UI. The controller uses the literal roles `"Instructor,Admin"` instead of the existing policies. | **L** | `.../Services/AI/OpenAiAssessmentService.cs`, `src/TeacherAssistant.API/Controllers/QuizzesController.cs`, `.../DTOs/Quizzes/*`, `.../Domain/Entities/Quiz.cs`, `Submission.cs`, `src/src/features/**` |
| 3 | **Admin role has no surface** | `UserRole.Admin` is seeded and the `AdminOnly` policy is registered, but no endpoint or page uses it. There is no tenant list/suspend/activate, no user administration, and `Tenant.IsActive` cannot be changed after seeding. | **L** | `src/TeacherAssistant.API/Program.cs`, `Authorization/AuthorizationPolicies.cs`, new `Controllers/AdminController.cs`, `Services/Tenancy/TenantManagementService.cs`, `src/src/routes/index.tsx`, new admin pages |
| 4 | **Paid-content model is half-wired** | `Subject.Price` exists in the domain but is absent from `SubjectSummaryDto`/`SubjectDetailDto` and every UI, while `CheckoutRequestDto` already takes a `SubjectId`. Either surface the price or remove it. | **S** | `.../DTOs/Subjects/SubjectSummaryDto.cs`, `SubjectDetailDto.cs`, `.../Services/Subjects/SubjectService.cs`, `src/src/features/subjects/types.ts`, `SubjectForm.tsx` |
| 5 | **Lesson DTO fields are unused by the frontend** | `LessonDto.SubjectId`/`SubjectTitle` are returned but the viewer reads the subject from route params instead. Harmless today, but two sources of truth. | **S** | `src/src/features/subjects/pages/LessonViewerPage.tsx`, `.../DTOs/Subjects/LessonDto.cs` |
| 6 | **Cleanup completed** | `mockData.ts`, the `VITE_USE_MOCKS` flag and the unused `StudentDashboardPage.tsx` were removed; no other dead frontend pages remain. | — | — |

---

## 2. Security concerns

| # | Concern | Detail | Effort | Files it would touch |
|---|---------|--------|--------|----------------------|
| 1 | **Hardcoded secrets** | `appsettings.json` contains a real-looking JWT secret, the LocalDB connection string, seed admin/teacher passwords and placeholder payment/OpenAI keys. `Program.cs` also falls back to a public constant JWT key when configuration is missing. | **S** | `src/TeacherAssistant.API/appsettings.json`, `appsettings.Development.json`, `Program.cs`, `src/TeacherAssistant.Infrastructure/Settings/*` |
| 2 | **No rate limiting / lockout** | There is no `AddRateLimiter`/`UseRateLimiter` anywhere. Login, `register-teacher`, `register-student` (join-code guessing) and `POST /groups/join` can be brute-forced. Join codes are 8 chars from a 32-char alphabet, but unlimited attempts still make them guessable. | **M** | `src/TeacherAssistant.API/Program.cs`, `Controllers/AuthController.cs`, `Controllers/GroupsController.cs` |
| 3 | **Cross-tenant branding update** | `PUT /api/v1/tenants/current` only checks `InstructorOnly`. Any instructor can send another tenant's `X-Tenant` header and edit that tenant's name, logo, colours and bio, because `TenantManagementService.UpdateCurrentAsync` never verifies that the caller belongs to the resolved tenant. | **S** | `src/TeacherAssistant.API/Controllers/TenantsController.cs`, `.../Services/Tenancy/TenantManagementService.cs` |
| 4 | **Payment webhook is anonymous and unverified** | `POST /payments/webhook` is `[AllowAnonymous]` and the service does not verify Stripe/Fawry/Paymob signatures. Once implemented, anyone could post a fake "paid" event. | **M** | `Controllers/PaymentsController.cs`, `Services/Payments/PaymentService.cs`, `DTOs/Payments/PaymentWebhookDto.cs` |
| 5 | **Checkout is under-validated** | `POST /payments/checkout` is `[Authorize]` for every role. It does not check that the subject exists in the caller's tenant, that the student is not already enrolled, or that the subject is paid. | **M** | `Controllers/PaymentsController.cs`, `Services/Payments/PaymentService.cs`, `DTOs/Payments/CheckoutRequestDto.cs` |
| 6 | **Quiz PDF upload has no limits** | The controller only rejects null/empty files, then buffers the whole PDF in memory. No size cap, content-type or extension check, so a large upload is a memory/DoS risk. | **S/M** | `Controllers/QuizzesController.cs`, `Program.cs` (request limits) |
| 7 | **Weak password policy** | Only `MinimumLength = 8`, no complexity, breached-password or common-password check, and no maximum attempt/lockout. There is no change-password or forgot-password flow; an instructor can set any 8-character password for a student. | **M** | `DTOs/Auth/RegisterTeacherRequestDto.cs`, `RegisterStudentRequestDto.cs`, `DTOs/Students/ResetStudentPasswordDto.cs`, `Services/Auth/AuthService.cs`, `Services/Students/StudentService.cs`, new endpoints |
| 8 | **JWT weaknesses** | Missing configuration silently uses the hardcoded fallback key; access tokens last 120 minutes with no refresh token or revocation, so "logout" is client-side only. | **M** | `Program.cs`, `.../Services/Auth/JwtTokenGenerator.cs`, `.../Settings/JwtSettings.cs`, `src/src/features/auth/AuthContext.tsx` |
| 9 | **Exception details leak to clients** | `GlobalExceptionHandlingMiddleware` returns `exception.Message` in the `errors` array, which can expose SQL/schema/internal details. | **S** | `src/TeacherAssistant.API/Middlewares/GlobalExceptionHandlingMiddleware.cs` |
| 10 | **No email verification** | Registration immediately issues a JWT, so unverified emails can use the platform and impersonate someone else's address. | **M** | `Services/Auth/AuthService.cs`, `Controllers/AuthController.cs`, new email service |
| 11 | **No audit trail** | Password resets, membership moves/removals, join-code regeneration and branding changes leave no log. | **M** | new `AuditLog` entity/configuration, `Services/Students/StudentService.cs`, `Services/Groups/GroupService.cs`, `Services/Tenancy/TenantManagementService.cs` |

Note: subject/group/lesson ownership checks and tenant filters are otherwise good — every mutation verifies the caller owns the subject/group, and the tenant query filter scopes users, groups and memberships.

---

## 3. Missing basics (ranked by importance)

| Rank | Feature | Why a real teacher needs it | Effort | Files it would touch |
|------|---------|-----------------------------|--------|----------------------|
| 1 | **Forgot / change password** | Users who forget a password currently need a teacher or a database change; students have no self-service at all. | **S/M** | `AuthController.cs`, `AuthService.cs`, `IAuthService.cs`, new DTOs, `StudentLoginPage.tsx`, `ErrorPage`, optional email service |
| 2 | **Student profile page** | Students cannot update their name, email, password or see their group/subject summary in one place. | **S/M** | new `StudentsController` endpoints, `StudentService.cs`, new `features/profile/*`, `routes/index.tsx` |
| 3 | **Teacher public profile** | The tenant site shows only the tenant name/bio; there is no teacher bio, contact or credentials page. | **S** | `TenantManagementService.cs`, `TenantBrandingDto`, `TenantHomePage.tsx`, `BrandingSettingsPage.tsx` |
| 4 | **Global student search & CSV export** | Search exists only inside one group. Teachers cannot find a student across groups or export a roster. | **M** | new `GET /students?search=`, `StudentService.cs`, `GroupStudentsModal.tsx`, new students page |
| 5 | **Attendance** | No attendance entity, session or register. This is a core weekly task for teachers. | **L** | new `Attendance` entity + configuration + migration, `GroupService.cs`, new endpoints/pages, group page |
| 6 | **Announcements / notifications** | No way to broadcast a message to a group or subject, in-app or by email. | **M** | new `Announcement` entity + migration, `GroupService.cs`/new service, group page, student home |
| 7 | **Lesson progress tracking** | No "completed" state, percentage or resume point; students cannot see what is left. | **L** | new `LessonProgress` entity + migration, `SubjectService.cs`, `LessonViewerPage.tsx`, `MySubjectsPage.tsx` |
| 8 | **Real file uploads** | Thumbnails and lesson PDFs are URL-only, so teachers must host files elsewhere. | **M/L** | `Program.cs` (static files/storage), `SubjectsController.cs`, `SubjectForm.tsx`, `LessonModal.tsx`, storage service |
| 9 | **Quizzes (authoring + taking)** | DTOs, entities and endpoints exist but are stubs; students cannot take a quiz and teachers cannot review results. | **L** | `OpenAiAssessmentService.cs`, `QuizzesController.cs`, new quiz pages, `routes/index.tsx` |
| 10 | **Payments / paid enrollment** | `Subject.Price` and checkout exist in name only; there is no way to charge or gate a subject. | **L** | `PaymentService.cs`, `PaymentsController.cs`, `SubjectService.cs`, new checkout pages |
| 11 | **Admin panel** | Platform admin cannot list tenants, suspend a tenant, reset a teacher's password or inspect usage. | **L** | new `AdminController.cs`, `TenantManagementService.cs`, `src/src/features/admin/*`, `routes/index.tsx` |
| 12 | **Email verification & notifications** | No email infrastructure at all (no SMTP/MailKit), so verification, password reset and announcements cannot be delivered. | **M** | new email service + settings, `AuthService.cs`, `appsettings.json` |
| 13 | **Audit log viewer** | Complements the audit trail above; useful for support and disputes. | **M** | new `AuditLog` entity, admin pages, `AdminController.cs` |
| 14 | **Lesson comments / Q&A** | Students have no way to ask a question on a specific lesson. | **L** | new `LessonComment` entity + migration, `LessonsController.cs`, `LessonViewerPage.tsx` |
| 15 | **Schedule / calendar view** | `Group.ScheduleText` is free text; there is no calendar, upcoming-session list or reminder. | **M/L** | `Group.cs`, `GroupService.cs`, `MySubjectsPage.tsx`, group pages |

---

### Suggested next three steps

1. Fix the security items marked **S** first: remove hardcoded secrets from `appsettings.json`/`Program.cs`, add the tenant-ownership check to branding updates, and stop returning `exception.Message`.
2. Add rate limiting for login, teacher/student registration and join-code endpoints (one `AddRateLimiter` policy plus attributes).
3. Add forgot/change-password plus a student profile page — the smallest features that make the product usable without manual database help.
