# ERD — TeacherAssistantLms

> Generated from the real EF Core configurations (`src/TeacherAssistant.Infrastructure/Persistence/Configurations/*.cs`) and the latest model snapshot (`src/TeacherAssistant.Infrastructure/Persistence/Migrations/ApplicationDbContextModelSnapshot.cs`). This reflects the **current, as-built** database schema including tables not yet fully used by the API (`Enrollments`, `PaymentTransactions`, `Quizzes`, `Submissions`).

```mermaid
erDiagram
    TENANT {
        Guid Id PK
        string Name "nvarchar(150), required"
        string Subdomain "nvarchar(63), required, unique"
        string LogoUrl "nvarchar(500), nullable"
        string PrimaryColor "nvarchar(9), nullable"
        string Bio "nvarchar(1000), nullable"
        bool IsActive "bit, default true"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    USER {
        Guid Id PK
        Guid? TenantId FK "nullable, platform admin = null"
        string Name "nvarchar(150), required"
        string Email "nvarchar(256), required"
        string PasswordHash "nvarchar(max), required"
        int Role "int, 1=Instructor, 2=Student, 3=Admin"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    SUBJECT {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid InstructorId FK "required"
        string Title "nvarchar(200), required"
        string Description "nvarchar(2000), required"
        decimal Price "decimal(18,2)"
        string ThumbnailUrl "nvarchar(500), nullable"
        bool IsPublished "bit, default false"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    LESSON {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid SubjectId FK "required"
        string Title "nvarchar(200), required"
        string Description "nvarchar(2000), required"
        int ContentType "int, 1=Video..5=Link"
        string ContentUrl "nvarchar(500), required"
        int SortOrder "int, required"
        bool IsPublished "bit, default false"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    GROUP {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid SubjectId FK "required"
        string Name "nvarchar(150), required"
        string ScheduleText "nvarchar(500), nullable"
        string JoinCode "nvarchar(8), required"
        bool IsCodeActive "bit, default true"
        bool IsOpen "bit, default true"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    GROUP_MEMBERSHIP {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid GroupId FK "required"
        Guid SubjectId "denormalized, no FK"
        Guid StudentId FK "required"
        DateTime JoinedAt "datetime2, default UtcNow"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    ENROLLMENT {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid StudentId FK "required"
        Guid SubjectId FK "required"
        int Status "int, 1=Pending..4=Cancelled"
        DateTime EnrolledAt "datetime2, default UtcNow"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    PAYMENT_TRANSACTION {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid EnrollmentId FK "required"
        decimal Amount "decimal(18,2)"
        int Status "int, 1=Pending..4=Refunded"
        string TransactionRef "nvarchar(200), required"
        string PaymentProvider "nvarchar(50), required"
        DateTime? PaidAt "datetime2, nullable"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    QUIZ {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid SubjectId FK "required"
        Guid? LessonId FK "nullable"
        string Title "nvarchar(250), required"
        string QuestionsData "nvarchar(max), JSON"
        decimal TotalScore "decimal(18,2)"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    SUBMISSION {
        Guid Id PK
        Guid? TenantId "nullable"
        Guid QuizId FK "required"
        Guid StudentId FK "required"
        decimal? Score "decimal(18,2), nullable"
        string AnswersData "nvarchar(max), JSON"
        string Feedback "nvarchar(2000), nullable"
        DateTime SubmittedAt "datetime2, default UtcNow"
        DateTime CreatedAt "datetime2"
        DateTime? UpdatedAt "datetime2, nullable"
    }

    TENANT ||--o{ USER : "TenantId (Restrict)"
    USER ||--o{ SUBJECT : "InstructorId (Restrict)"
    USER ||--o{ GROUP_MEMBERSHIP : "StudentId (Cascade)"
    USER ||--o{ ENROLLMENT : "StudentId (Cascade)"
    USER ||--o{ SUBMISSION : "StudentId (Cascade)"
    SUBJECT ||--o{ LESSON : "SubjectId (Cascade)"
    SUBJECT ||--o{ GROUP : "SubjectId (Cascade)"
    SUBJECT ||--o{ ENROLLMENT : "SubjectId (Cascade)"
    SUBJECT ||--o{ QUIZ : "SubjectId (Cascade)"
    GROUP ||--o{ GROUP_MEMBERSHIP : "GroupId (Cascade)"
    LESSON ||--o{ QUIZ : "LessonId (NoAction)"
    QUIZ ||--o{ SUBMISSION : "QuizId (Cascade)"
    ENROLLMENT ||--o{ PAYMENT_TRANSACTION : "EnrollmentId (Cascade)"
```

---

## Unique Constraints & Indexes

| Table | Constraint / Index | Columns | Type | Filter |
|-------|-------------------|---------|------|--------|
| Tenant | `IX_Tenants_Subdomain` | Subdomain | Unique | — |
| User | `IX_Users_TenantId_Email` | TenantId, Email | Unique | `[TenantId] IS NOT NULL` |
| Group | `IX_Groups_TenantId_JoinCode` | TenantId, JoinCode | Unique | `[TenantId] IS NOT NULL` |
| GroupMembership | `IX_GroupMemberships_StudentId_SubjectId` | StudentId, SubjectId | Unique | — |
| Enrollment | `IX_Enrollments_StudentId_SubjectId` | StudentId, SubjectId | Unique | — |
| All ITenantEntity tables | Auto-generated by `ApplyTenantIsolation` | TenantId | Non-unique | — |
| Lesson | `IX_Lessons_SubjectId_SortOrder` | SubjectId, SortOrder | Non-unique | — |
| Group | `IX_Groups_SubjectId` | SubjectId | Non-unique | — |
| GroupMembership | `IX_GroupMemberships_GroupId` | GroupId | Non-unique | — |
| GroupMembership | `IX_GroupMemberships_SubjectId` | SubjectId | Non-unique | — |
| PaymentTransaction | `IX_PaymentTransactions_EnrollmentId` | EnrollmentId | Non-unique | — |
| Quiz | `IX_Quizzes_LessonId` | LessonId | Non-unique | — |
| Quiz | `IX_Quizzes_SubjectId` | SubjectId | Non-unique | — |
| Submission | `IX_Submissions_QuizId` | QuizId | Non-unique | — |
| Submission | `IX_Submissions_StudentId` | StudentId | Non-unique | — |

---

## FK Delete Behaviors

| FK | From → To | OnDelete | Notes |
|----|-----------|----------|-------|
| `FK_Users_Tenants_TenantId` | User → Tenant | **Restrict** | Platform admins (TenantId=null) unaffected |
| `FK_Subjects_Users_InstructorId` | Subject → User | **Restrict** | Prevents deleting instructor with subjects |
| `FK_Lessons_Subjects_SubjectId` | Lesson → Subject | Cascade | Deleting subject removes lessons |
| `FK_Groups_Subjects_SubjectId` | Group → Subject | Cascade | Deleting subject removes groups |
| `FK_Enrollments_Subjects_SubjectId` | Enrollment → Subject | Cascade | Deleting subject removes enrollments |
| `FK_Quizzes_Subjects_SubjectId` | Quiz → Subject | Cascade | Deleting subject removes quizzes |
| `FK_GroupMemberships_Groups_GroupId` | GroupMembership → Group | Cascade | Deleting group removes memberships |
| `FK_GroupMemberships_Users_StudentId` | GroupMembership → User | Cascade | Deleting student removes memberships |
| `FK_Enrollments_Users_StudentId` | Enrollment → User | Cascade | Deleting student removes enrollments |
| `FK_Submissions_Users_StudentId` | Submission → User | Cascade | Deleting student removes submissions |
| `FK_PaymentTransactions_Enrollments_EnrollmentId` | PaymentTransaction → Enrollment | Cascade | Deleting enrollment removes payments |
| `FK_Quizzes_Lessons_LessonId` | Quiz → Lesson | **NoAction** | Avoids multiple cascade paths |
| `FK_Submissions_Quizzes_QuizId` | Submission → Quiz | Cascade | Deleting quiz removes submissions |

---

## Table Descriptions (Arabic-Friendly)

| Table | Description (AR) |
|-------|------------------|
| **Tenants** | الجدول الرئيسي للمستأجرين (كل معلم/أكاديمية = مستأجر مستقل برابط فرعي فريد). |
| **Users** | جدول المستخدمين: مدرسون، طلاب، وأدمن المنصة. البريد فريد داخل كل مستأجر. |
| **Subjects** | المواد الدراسية (مثل "كيمياء")، يملكها معلم واحد، وتحتوي دروسًا ومجموعات. |
| **Lessons** | الدروس داخل المادة، مرتبة بـ SortOrder، وتشير لمحتوى خارجي (فيديو/رابط). |
| **Groups** | مجموعات التدريس داخل مادة (مثل "السبت 5 مساءً")، الطلاب ينضمون بكود انضمام فريد. |
| **GroupMemberships** | يربط طالبًا بمجموعة واحدة في مادة واحدة. قيد التفرد يضمن مجموعة واحدة لكل طالب في المادة. |
| **Enrollments** | تسجيل طالب في مادة (نظام دفع/اشتراكات) — قيد التطوير، غير مستخدم فعليًا. |
| **PaymentTransactions** | سجلات عمليات الدفع (Stripe/Fawry/Paymob) — Stub فقط، غير مفعل. |
| **Quizzes** | اختبارات مرتبطة بمادة (واختياريًا درس)، الأسئلة محفوظة كـ JSON — Stub فقط. |
| **Submissions** | تسليمات الطلاب للاختبارات، الإجابات والدرجة كـ JSON — Stub فقط. |

---

## Tenant Isolation Notes

- **Every `ITenantEntity`** (User, Subject, Lesson, Group, GroupMembership, Enrollment, PaymentTransaction, Quiz, Submission) gets:
  - `TenantId` (nullable Guid)
  - Auto-index on `TenantId` via `ApplyTenantIsolation`
  - Global query filter: `CurrentTenantId == null || e.TenantId == CurrentTenantId`
- **Tenant** itself is **not** an `ITenantEntity` (root of hierarchy).
- Platform-level requests (`CurrentTenantId == null`) bypass the filter — intended for platform admins.
- Write guard in `SaveChangesAsync` stamps `TenantId` on new entities and throws on cross-tenant inserts.
- Only `DatabaseSeeder` uses `.IgnoreQueryFilters()` (4 occurrences) for cross-tenant seed lookups.