# Teacher Assistant LMS - Backend Architecture & Scaffolding

مشروع تخرج: منصة **Teacher Assistant LMS** بنظام البرمجيات كخدمة (SaaS).  
تم بناء الهيكل الأساسي وفقاً لنمط **Clean Architecture (Onion Architecture)** ذو الـ 4 طبقات (4 Layers) باستخدام **ASP.NET Core Web API**.

جميع الواجهات البرمجية (APIs)، النماذج (Entities & DTOs)، الطبقات، وقاعدة البيانات تم تجهيزها كـ **Scaffolding / Skeletons** مع توفير تعليقات توضيحية (`// TODO`) لتتمكنوا من برمجة منطق العمل (Business Logic) بأنفسكم.

---

## 🏗️ معمارية المشروع (4-Layer Clean Architecture)

```
TeacherAssistantLms.sln
├── src/
│   ├── TeacherAssistant.Domain/                 # [1] الطبقة الأولى: النواة وقواعد النطاق (Core Domain)
│   │   ├── Common/
│   │   │   └── BaseEntity.cs                    # الكيان الأساسي (Id, CreatedAt, UpdatedAt)
│   │   ├── Entities/
│   │   │   ├── User.cs                          # المستخدمين (مدرس، طالب، مسؤول)
│   │   │   ├── Course.cs                        # الكورسات
│   │   │   ├── Lesson.cs                        # الدروس والمواد التعليمية (PDF, Video)
│   │   │   ├── Enrollment.cs                    # سجلات اشتراك الطلاب
│   │   │   ├── PaymentTransaction.cs            # المعاملات المالية
│   │   │   ├── Quiz.cs                          # التقييمات والاختبارات الذكية
│   │   │   └── Submission.cs                    # إجابات الطلاب والنتائج
│   │   └── Enums/
│   │       ├── UserRole.cs                      # Instructor, Student, Admin
│   │       ├── ContentType.cs                   # Video, Pdf, Word, Article
│   │       ├── EnrollmentStatus.cs              # Pending, Active, Completed, Cancelled
│   │       └── PaymentStatus.cs                 # Pending, Completed, Failed, Refunded
│   │
│   ├── TeacherAssistant.Application/            # [2] الطبقة الثانية: منطق التطبيق والعقود (Application)
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   ├── IApplicationDbContext.cs    # عقد قاعدة البيانات
│   │   │   │   ├── ICurrentUserService.cs       # استخراج بيانات وصلاحيات المستخدم الحالي
│   │   │   │   └── IJwtTokenGenerator.cs        # عقد توليد رموز JWT
│   │   │   └── Models/
│   │   │       └── ApiResponse.cs               # نموذج الاستجابة الموحد لجميع الـ Endpoints
│   │   ├── DTOs/
│   │   │   ├── Auth/                            # نماذج تسجيل الدخول والحسابات
│   │   │   ├── Courses/                         # نماذج إنشاء واستعراض الكورسات والمواد
│   │   │   ├── Payments/                        # نماذج الدفع والـ Webhooks
│   │   │   └── Quizzes/                         # نماذج توليد الاختبارات وتصحيحها
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs                  # واجهة خدمات المصادقة
│   │   │   ├── ICourseService.cs                # واجهة إدارة الكورسات والمحتوى
│   │   │   ├── IPaymentService.cs               # واجهة بوابات الدفع (Stripe/Fawry/Paymob)
│   │   │   └── IAIAssessmentService.cs          # واجهة محرك الذكاء الاصطناعي للاختبارات
│   │   └── DependencyInjection.cs               # حقن التبعيات لطبقة Application
│   │
│   ├── TeacherAssistant.Infrastructure/         # [3] الطبقة الثالثة: البنية التحتية والبيانات (Infrastructure)
│   │   ├── Persistence/
│   │   │   ├── ApplicationDbContext.cs          # تطبيق EF Core وسياق قاعدة البيانات
│   │   │   └── Configurations/                  # تكوينات الجداول والعلاقات عبر Fluent API
│   │   │       ├── UserConfiguration.cs
│   │   │       ├── CourseConfiguration.cs
│   │   │       ├── LessonConfiguration.cs
│   │   │       ├── EnrollmentConfiguration.cs
│   │   │       ├── PaymentTransactionConfiguration.cs
│   │   │       ├── QuizConfiguration.cs
│   │   │       └── SubmissionConfiguration.cs
│   │   ├── Services/                            # هياكل تنفيذ الخدمات (Stubs جاهزة للبرمجة)
│   │   │   ├── Auth/
│   │   │   │   ├── JwtTokenGenerator.cs         # توليد التوكن مع Claims مخصصة للـ Tenancy
│   │   │   │   └── AuthService.cs               # هيكل المصادقة مع TODO
│   │   │   ├── Courses/
│   │   │   │   └── CourseService.cs             # هيكل إدارة الكورسات مع TODO
│   │   │   ├── Payments/
│   │   │   │   └── PaymentService.cs            # هيكل بوابات الدفع والـ Webhooks مع TODO
│   │   │   └── AI/
│   │   │       └── OpenAiAssessmentService.cs   # هيكل قراءة الـ PDF و OpenAI مع TODO
│   │   ├── Settings/
│   │   │   ├── JwtSettings.cs                   # إعدادات الـ JWT
│   │   │   ├── OpenAiSettings.cs                # إعدادات الـ OpenAI
│   │   │   └── PaymentSettings.cs               # إعدادات بوابات الدفع
│   │   └── DependencyInjection.cs               # تسجيل سياق SQL Server وخدمات البنية التحتية
│   │
│   └── TeacherAssistant.API/                    # [4] الطبقة الرابعة: واجهة العرض والـ Endpoints (Presentation)
│       ├── Controllers/
│       │   ├── BaseApiController.cs             # المتحكم الأساسي الموحد لـ api/v1/[controller]
│       │   ├── AuthController.cs                # POST /api/v1/auth/register & login
│       │   ├── CoursesController.cs             # GET & POST /api/v1/courses & materials
│       │   ├── PaymentsController.cs            # POST /api/v1/payments/checkout & webhook
│       │   └── QuizzesController.cs             # POST /api/v1/quizzes/generate-from-pdf & submit
│       ├── Middlewares/
│       │   ├── GlobalExceptionHandlingMiddleware.cs # المعالجة المركزية لجميع الاستثناءات
│       │   └── RequestLoggingMiddleware.cs      # تسجيل ومراقبة الطلبات الواردة والزمن المستغرق
│       ├── Services/
│       │   └── CurrentUserService.cs            # قراءة Claims المستخدم من الـ HttpContext
│       ├── appsettings.json                     # ملف الإعدادات ومفاتيح الاتصال
│       └── Program.cs                           # نقطة انطلاق التطبيق وربط خط المعالجة (Pipeline)
```

---

## 🚀 كيفية تشغيل المشروع

1. **بناء الحل بالكامل والتأكد من نجاحه:**
   ```bash
   dotnet build
   ```

2. **تشغيل الـ Web API:**
   ```bash
   dotnet run --project src/TeacherAssistant.API
   ```

3. **استعراض وتجربة الـ Endpoints عبر التوثيق التفاعلي (Scalar):**
   افتح المتصفح على:
   ```
   https://localhost:5001/scalar/v1
   أو
   http://localhost:5000/scalar/v1
   ```

---

## ⚙️ إعدادات قاعدة البيانات والخدمات الخارجية

يمكنك تعديل القيم في ملف `src/TeacherAssistant.API/appsettings.json`:
- **DefaultConnection**: جملة الاتصال بـ SQL Server الخاص بك.
- **JwtSettings**: مفتاح التشفير ومدة صلاحية التوكن.
- **OpenAiSettings**: مفتاح الـ API لـ OpenAI ونوع النموذج (`gpt-4o-mini`).
- **PaymentSettings**: مفاتيح Stripe / Fawry / Paymob.

---

## 📌 خطوات إنشاء أول Migration لقاعدة البيانات:
عندما تكون جاهزاً لتطبيق الجداول على سيرفر الـ SQL Server:
```bash
dotnet ef migrations add InitialCreate --project src/TeacherAssistant.Infrastructure --startup-project src/TeacherAssistant.API
dotnet ef database update --project src/TeacherAssistant.Infrastructure --startup-project src/TeacherAssistant.API
```
