# Teacher Assistant LMS — Backend

مشروع تخرج: منصة **Teacher Assistant LMS** بنظام البرمجيات كخدمة (SaaS)، مبني بنمط
**Clean Architecture** على 4 طبقات باستخدام **ASP.NET Core Web API** و**EF Core + SQL Server**.

- **Phase 1** — Authentication + multi-tenancy (`TenantId` + `X-Tenant` header).
- **Phase 2** — Subjects + lessons.
- **Phase 3** — `Course` → `Subject` rename (data-preserving) + **Groups / Group memberships**,
  registration with a **join code**, and membership-based content visibility.

> الطبقات مبنية بشكل كامل، وبعض الخدمات الخارجية (Payments / AI Quizzes) ما زالت هياكل
> أولية (Stubs) مع تعليقات `// TODO`.

---

## 🏗️ معمارية المشروع (4-Layer Clean Architecture)

```
TeacherAssistantLms.slnx
├── src/
│   ├── TeacherAssistant.Domain/                 # [1] Core Domain
│   │   ├── Common/
│   │   │   ├── BaseEntity.cs                    # Id, CreatedAt, UpdatedAt
│   │   │   └── ITenantEntity.cs                 # كل كيان يخص منصة (Tenant)
│   │   ├── Entities/
│   │   │   ├── User.cs                          # Instructor, Student, Admin
│   │   │   ├── Tenant.cs                        # المنصة (subdomain + branding)
│   │   │   ├── Subject.cs                       # المادة
│   │   │   ├── Group.cs                         # مجموعة داخل المادة + JoinCode
│   │   │   ├── GroupMembership.cs               # طالب واحد في مجموعة واحدة لكل مادة
│   │   │   ├── Lesson.cs
│   │   │   ├── Enrollment.cs
│   │   │   ├── PaymentTransaction.cs
│   │   │   ├── Quiz.cs
│   │   │   └── Submission.cs
│   │   └── Enums/
│   │
│   ├── TeacherAssistant.Application/            # [2] Application
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   ├── Models/                          # ApiResponse, ServiceResult
│   │   │   └── JoinCodeRules.cs                 # توليد/تحقق أكواد المجموعات
│   │   ├── DTOs/
│   │   │   ├── Auth/                            # register-teacher, register-student (joinCode), login
│   │   │   ├── Subjects/                        # Subject + Lesson DTOs
│   │   │   ├── Groups/                          # Group, Members, Join, Move, MyGroup
│   │   │   ├── Students/                        # ResetStudentPasswordDto
│   │   │   ├── Payments/
│   │   │   └── Quizzes/
│   │   └── Interfaces/                          # ISubjectService, IGroupService, IStudentService, ...
│   │
│   ├── TeacherAssistant.Infrastructure/         # [3] Infrastructure
│   │   ├── Persistence/
│   │   │   ├── ApplicationDbContext.cs          # Global tenant query filters
│   │   │   ├── ApplicationDbContextFactory.cs   # Design-time factory (connection string من الإعدادات)
│   │   │   ├── DatabaseSeeder.cs                # Admin + demo teacher + subject + 2 groups
│   │   │   ├── Configurations/
│   │   │   └── Migrations/
│   │   ├── Services/
│   │   │   ├── Auth/
│   │   │   ├── Subjects/
│   │   │   ├── Groups/
│   │   │   ├── Students/
│   │   │   ├── Payments/
│   │   │   └── AI/
│   │   └── Settings/
│   │
│   └── TeacherAssistant.API/                    # [4] Presentation
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── SubjectsController.cs            # /api/v1/subjects
│       │   ├── GroupsController.cs
│       │   ├── StudentsController.cs
│       │   ├── LessonsController.cs
│       │   ├── TenantsController.cs
│       │   ├── PaymentsController.cs
│       │   └── QuizzesController.cs
│       ├── Middlewares/
│       ├── Services/CurrentUserService.cs
│       ├── appsettings.json
│       └── Program.cs
│
└── tests/
    └── TeacherAssistant.IntegrationTests/       # in-memory SQLite + WebApplicationFactory
```

---

## 👥 Getting Started for Teammates (دليل البدء السريع لزملاء الفريق)

### 1. المتطلبات المسبقة (Prerequisites)
- **.NET 10.0 SDK** (أو أحدث): تأكد بالأمر `dotnet --version`
- **Node.js** (v18+ أو v20+) و **npm**: تأكد بالأمر `node -v` و `npm -v`
- **SQL Server** أو **LocalDB**:
  - في بيئة التطوير المحلية يتم استخدام SQL Server LocalDB افتراضياً (`(localdb)\mssqllocaldb`)
  - أو خادم SQL Server محلي / Docker container
- **Git**

---

### 2. خطوات التثبيت والتشغيل (Setup Steps)

#### أ) استنساخ المستودع (Clone)
```bash
git clone <repository-url>
cd "TeacherAssistantLms" # أو مجلد المشروع
```

#### ب) إعداد جملة الاتصال بقاعدة البيانات (Connection String)
- الإعداد الافتراضي لبيئة التطوير موجود في `src/TeacherAssistant.API/appsettings.Development.json`:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TeacherAssistantDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
  ```
- إذا كنت تستخدم خادم SQL Server محلياً (Local Instance / Express)، يمكنك تعديل `ConnectionStrings:DefaultConnection` في `src/TeacherAssistant.API/appsettings.json` أو تمرير متغير بيئة:
  ```powershell
  $env:ConnectionStrings__DefaultConnection="Server=localhost;Database=TeacherAssistantDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  ```
- **ملاحظة**: عند إقلاع الـ API، يقوم النظام تلقائياً بتطبيق جميع الـ Migrations وتهيئة بيانات الديمو (`Database:AutoMigrate: true`)، فلا حاجة لتشغيل أوامر `dotnet ef` يدوياً عند أول تشغيل.

#### ج) تشغيل الباك إند (Run Backend API)
```bash
# من جذر المشروع:
dotnet run --project src/TeacherAssistant.API --launch-profile http
```
- سيعمل الـ API على المنفذ: `http://localhost:5014`
- واجهة توثيق واختبار الـ API التفاعلية (Scalar): `http://localhost:5014/scalar/v1`

#### د) تشغيل الواجهة الأمامية (Run Frontend)
```bash
# الانتقال لمجلد الفرونت إند
cd src

# إنشاء ملف البيئة من النموذج
cp .env.example .env

# تثبيت الحزم والاعتماديات
npm install

# تشغيل خادم التطوير
npm run dev
```
- ستعمل الواجهة على: `http://localhost:5173`

---

### 3. الحسابات التجريبية (Demo Accounts)

عند تشغيل الباك إند في بيئة التطوير (`Development`) يتم إنشاء الحسابات التجريبية التالية تلقائياً:

| الحساب | الدور | البريد الإلكتروني | كلمة المرور | الموقع المخصص للدخول | الملاحظات / الجروب |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **المعلم التجريبي** | Instructor | `teacher@demo.local` | `Demo@12345` | موقع المنصة (`http://localhost:5173/teacher/login`) | يملك منصة `demo` ومادة كيمياء تالتة ثانوي |
| **طالب 1 (أحمد علي)** | Student | `student1@demo.local` | `Demo@12345` | منصة المعلم (`/t/demo/login` أو `http://demo.localhost:5173/login`) | مسجل في جروب السبت `SAT5CHEM` |
| **طالب 2 (مريم حسن)** | Student | `student2@demo.local` | `Demo@12345` | منصة المعلم (`/t/demo/login` أو `http://demo.localhost:5173/login`) | مسجل في جروب الاثنين `MND7CHEM` |
| **طالب 3 (عمر خالد)** | Student | `student3@demo.local` | `Demo@12345` | منصة المعلم (`/t/demo/login` أو `http://demo.localhost:5173/login`) | مسجل في جروب السبت `SAT5CHEM` |
| **مدير المنصة** | Admin | `admin@platform.local` | `Admin@12345` | موقع المنصة (`http://localhost:5173/teacher/login`) | حساب الإدارة العامة للنظام |

> 💡 **ميزة التعبئة التلقائية السريعة**: في كلا صفحتي تسجيل الدخول بالفرونت إند، يوجد صندوق **«حسابات تجريبية»** يظهر فقط أثناء التطوير؛ بنقرة واحدة يتم ملء البريد وكلمة المرور مباشرة لاختبار الحساب بسرعة.

---

## 🚀 تشغيل المشروع (Quick Reference)

```bash
dotnet build
dotnet run --project src/TeacherAssistant.API -e ASPNETCORE_ENVIRONMENT=Development
```

> التشغيل المحلي يحتاج تفعيل بيئة `Development` (كما بالأمر أعلاه) لأن مفتاح JWT التطويري موجود في
> `appsettings.Development.json` فقط. في الإنتاج مرّر المفتاح عبر متغير البيئة
> `JwtSettings__Secret` (32 حرفًا على الأقل) — التطبيق يرفض الإقلاع بدونه.

التوثيق التفاعلي (Scalar): `https://localhost:5001/scalar/v1` أو `http://localhost:5000/scalar/v1`.

---

## ⚙️ الإعدادات

في `src/TeacherAssistant.API/appsettings.json`:

- **`ConnectionStrings:DefaultConnection`** — جملة اتصال SQL Server.
  `ApplicationDbContextFactory` (المستخدم بواسطة `dotnet ef`) يقرأ نفس القيمة من الإعدادات
  أو من متغير البيئة `ConnectionStrings__DefaultConnection`، ولا يحتوي أي جملة اتصال مكتوبة داخل الكود.
- **`JwtSettings`** — الـ Issuer/Audience/المدة. **`JwtSettings:Secret` مطلوب ولا يوجد أي
  fallback داخل الكود:** لازم يكون 32 حرفًا على الأقل، وإلا يفشل التطبيق عند الإقلاع برسالة
  واضحة. المفتاح التطويري موجود في `appsettings.Development.json` فقط؛ للإنتاج استخدم
  `JwtSettings__Secret`.
- **`RateLimiting`** — حدود الحماية من التخمين (كلها قابلة للتعديل):
  `Login` (5 محاولات/دقيقة لكل IP + بريد)، `JoinCode` (10 محاولات/10 دقائق لكل IP
  لـ `register-student` و`groups/join`)، و`Public` (20 طلبًا/10 دقائق لكل IP
  لـ `register-teacher` و`check-subdomain`). أي تجاوز يرجع `429` برسالة عربية.
  `"Enabled": false` يعطّل كل الحدود (تستخدمه اختبارات التكامل افتراضيًا).
- **`Seed`** — بيانات الحسابات التجريبية والمادة/المجموعات (انظر أدناه).
- **`Database:AutoMigrate`** — عند `true` يتم تطبيق الميجريشن والـ Seed عند الإقلاع.

---

## 🧪 محتوى وبيانات الـ Seed التجريبية (Demo Seed Data)

| العنصر | القيمة |
| --- | --- |
| المنصة (Tenant) | `demo` (header: `X-Tenant: demo`) |
| المدرس | `teacher@demo.local` / `Demo@12345` |
| الأدمن | `admin@platform.local` / `Admin@12345` |
| المادة المنشورة | **كيمياء - تالتة ثانوي** (4 دروس منشورة: فيديو، Drive، PDF، مقال) |
| المادة المسودة | **مراجعة ليلة الامتحان في الفيزياء (مسودة)** (تظهر للمعلم فقط) |
| المجموعة 1 | **مجموعة السبت 5 مساءً** — كود الانضمام: **`SAT5CHEM`** (الطلاب: `student1`, `student3`) |
| المجموعة 2 | **مجموعة الإثنين 7 مساءً** — كود الانضمام: **`MND7CHEM`** (الطالب: `student2`) |

> لتجربة تسجيل طالب جديد بكود: `POST /api/v1/auth/register-student` مع `X-Tenant: demo` و`joinCode: "SAT5CHEM"`.

كلمات المرور التجريبية أعلاه تحقق القاعدة المشتركة: **8–100 حرف، وتحتوي على حرف ورقم على
الأقل**. نفس القاعدة مطبقة على `register-teacher` و`register-student` و`reset-password`.

---

## 🔁 Phase 3: Course → Subject والأكواد

- **المسارات:** المسار الرسمي الوحيد هو `/api/v1/subjects`، ومسارات المجموعات تحت
  `/api/v1/subjects/{id}/groups`. لا توجد مسارات بديلة أخرى.
- **قاعدة البيانات:** ميجريشن `20261117122205_Phase3SubjectGroups` يقوم بـ **Rename** للجدول
  `Courses` → `Subjects` وأعمدة `CourseId` → `SubjectId` (مع إعادة تسمية الفهارس والمفاتيح)
  ثم ينشئ جدولي `Groups` و`GroupMemberships`. **لا يتم حذف أي بيانات.**
- **أكواد الانضمام:** 8 أحرف من `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (بدون `0/O/1/I`)،
  فريدة داخل كل منصة، وقابلة لإعادة التوليد أو الإيقاف.
- **قاعدة العضوية:** فهرس فريد على `(StudentId, SubjectId)` — طالب واحد في مجموعة واحدة لكل مادة،
  ويمكنه الانضمام لمجموعات مواد أخرى.
- **الظهور:** الطالب يرى فقط المواد التي ينتمي لمجموعة فيها (والمنشورة فقط)؛ المدرس المالك يرى كل شيء.

قائمة الـ Endpoints الكاملة مع أمثلة JSON موجودة في [`API_CONTRACT.md`](API_CONTRACT.md).

---

## 🗄️ قاعدة البيانات والميجريشن

```bash
# تطبيق الميجريشن الموجودة (لا يحذف البيانات)
dotnet ef database update --project src/TeacherAssistant.Infrastructure --startup-project src/TeacherAssistant.API

# توليد ميجريشن جديدة لاحقاً
dotnet ef migrations add <Name> --project src/TeacherAssistant.Infrastructure --startup-project src/TeacherAssistant.API
```

> ⚠️ لا تستخدم `database drop` ولا أي سكربت يحذف قاعدة البيانات. ميجريشن Phase 3 مصمّمة
> للحفاظ على بيانات `Courses` الموجودة.

---

## 🧪 الاختبارات

```bash
dotnet test
```

اختبارات التكامل تعمل على SQLite in-memory مع `EnsureCreated` (تعتمد على الـ model وليس الميجريشن)،
وتغطي: العزل بين المنصات، تسجيل الطالب بكود، رفض الكود غير الصالح/غير النشط/الخاص بمنصة أخرى،
منع مجموعة ثانية في نفس المادة (409)، رؤية الطالب لمواده فقط، صلاحيات المدرس المالك،
نقل الطالب بين مجموعات المادة، وإعادة تعيين كلمة المرور. كما تغطي اختبارات الـ rate limiting
رجوع `429` بعد المحاولة السادسة لتسجيل الدخول وبعد تكرار أكواد الانضمام الخاطئة، ومنع مدرس
منصة أخرى من تعديل الـ branding (`403`).
