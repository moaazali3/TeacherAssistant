# Backend Actions — Prioritized Fixes

> Derived from `docs/DB_REVIEW.md`. Each action includes effort (S/M/L), risk, and affected files.
> **No code changes made** — this is a planning document.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Security / Data loss / Production crash risk — do immediately |
| **P1** | Correctness / Performance / Maintainability — do before graduation demo |
| **P2** | Technical debt / Nice to have — can defer |

| Effort | Definition |
|--------|------------|
| **S** | < 1 day (config, index, single-method change) |
| **M** | 1–3 days (new endpoint, migration, multi-file) |
| **L** | > 3 days (architectural, cross-cutting) |

| Risk | Definition |
|------|------------|
| **Low** | Isolated change, well-tested pattern, easy rollback |
| **Medium** | Touches multiple layers, requires API contract update |
| **High** | Schema migration with data risk, cascade behavior change |

---

## P0 — Security & Data Integrity

### P0-1: Add Platform Admin Email Unique Index
**Problem:** Filtered unique index `IX_Users_TenantId_Email` excludes `TenantId = NULL`. Platform admins can have duplicate emails; registration has race condition.

**Fix:** Add migration with filtered unique index:
```sql
CREATE UNIQUE INDEX IX_Users_Email_Platform ON Users(Email) WHERE TenantId IS NULL;
```

**Effort:** S | **Risk:** Low | **Files:**
- New migration: `Migrations/XXXX_AddPlatformAdminEmailUniqueIndex.cs`
- `UserConfiguration.cs` (optional: add second index for clarity)

---

### P0-2: Remove Join Codes from Seed Logs
**Problem:** `DatabaseSeeder.cs:101` logs demo group join codes at Information level. Codes are effectively enrollment passwords.

**Fix:** Remove `{CodeOne}`, `{CodeTwo}` from log message. Log only group names.

**Effort:** S | **Risk:** Low | **Files:**
- `DatabaseSeeder.cs` (line 97-102)

---

### P0-3: Add Pagination to All List Endpoints
**Problem:** Zero pagination. Endpoints return unbounded lists:
- `GET /api/v1/subjects`
- `GET /api/v1/subjects/mine`
- `GET /api/v1/subjects/{id}/groups`
- `GET /api/v1/groups/{id}/students`
- `GET /api/v1/groups/mine`

**Fix:**
1. Add `PagedRequest` / `PagedResult<T>` DTOs in `Application/Common/Models/`
2. Add `page` (default 1), `pageSize` (default 20, max 100) query params to controllers
3. Apply `.Skip((page-1)*pageSize).Take(pageSize)` in services
4. Return `totalCount` for client pagination UI

**Effort:** M | **Risk:** Medium (API contract change) | **Files:**
- `Application/Common/Models/PagedResult.cs` (new)
- `Application/DTOs/Subjects/*.cs` (update return types)
- `Application/DTOs/Groups/*.cs` (update return types)
- `SubjectsController.cs`, `GroupsController.cs`
- `SubjectService.cs` (GetMySubjectsAsync, GetSubjectsAsync)
- `GroupService.cs` (GetGroupsAsync, GetStudentsAsync, GetMyGroupsAsync)
- `API_CONTRACT.md` (update)

---

### P0-4: Add Correlation ID to Logging & Errors
**Problem:** No request correlation. Impossible to trace a single request across logs or match client error to server log.

**Fix:**
1. Middleware to generate/extract `X-Correlation-ID` header → `HttpContext.TraceIdentifier`
2. Enrich `RequestLoggingMiddleware` and `GlobalExceptionHandlingMiddleware` with correlation ID
3. Include correlation ID in 500 error response body

**Effort:** S | **Risk:** Low | **Files:**
- `RequestLoggingMiddleware.cs`
- `GlobalExceptionHandlingMiddleware.cs`
- New `CorrelationIdMiddleware.cs` (or extend `RequestLoggingMiddleware`)
- `Program.cs` (register middleware early)

---

## P1 — Correctness & Maintainability

### P1-1: Document or Remove Phase 2 Tables
**Problem:** `Enrollment`, `PaymentTransaction`, `Quiz`, `Submission`, `Subject.Price` exist in schema but are unused (stubs only). Cascade deletes from Subject wipe them silently.

**Option A (Document):** Add XML comments on entities + ERD note: "Phase 2: Payments & Quizzes — not implemented in MVP".

**Option B (Drop):** Create migration dropping 4 tables + `Subject.Price` column. Removes cascade risk.

**Recommendation:** **Option A** for graduation (shows foresight), **Option B** if scope freeze.

**Effort:** S (docs) / M (migration) | **Risk:** Low (docs) / Medium (migration) | **Files:**
- `ERD.md` (update)
- Entity files (add `<remarks>`)
- New migration if dropping

---

### P1-2: Soft Delete or Audit on Subject Deletion
**Problem:** `SubjectService.DeleteSubjectAsync` cascades destructively (lessons, groups, memberships, quizzes, submissions, enrollments, payments). One click = irreversible data loss.

**Fix Options:**
- **Soft Delete:** Add `IsDeleted` + `DeletedAt` to Subject. Global query filter excludes deleted. Keep cascade but mark deleted.
- **Hard Delete with Guard:** Require `?confirm=true` + check for related data → return 409 if groups/enrollments exist.
- **Audit Log:** Write deletion event to audit table before cascade.

**Recommendation:** Soft Delete (safest, supports undo). Add `IsDeleted` to Subject, update global filter in `ApplyTenantIsolation` to include `&& !e.IsDeleted`.

**Effort:** M | **Risk:** Medium (schema + query filter change) | **Files:**
- `Subject.cs` (add `IsDeleted`, `DeletedAt`)
- `SubjectConfiguration.cs`
- `ApplicationDbContext.cs` (extend `ConfigureTenantEntity` for Subject)
- `SubjectService.cs` (DeleteSubjectAsync → soft delete; GetSubjectsAsync auto-excludes)
- New migration

---

### P1-3: Soft Delete on User (Student)
**Problem:** Deleting a student (no API yet, but possible via SQL) cascades: memberships, submissions, enrollments, payments. All learning history gone.

**Fix:** Add `IsDeleted` + `DeletedAt` to User. Update global query filter. AuthService login should check `!IsDeleted`.

**Effort:** M | **Risk:** Medium | **Files:**
- `User.cs`, `UserConfiguration.cs`
- `ApplicationDbContext.cs`
- `AuthService.cs` (LoginAsync, RegisterStudentAsync)
- `StudentService.cs` (ResetPasswordAsync)
- New migration

---

### P1-4: Add FK from Child Entities to Tenant (or Document Risk)
**Problem:** Only `User.TenantId` has FK to Tenant. All other 8 tables have logical `TenantId` only. Direct SQL tenant deletion → massive orphans.

**Fix Options:**
- **Add FKs:** 8 new FKs (`Subject.TenantId`, `Lesson.TenantId`, etc.) with `OnDelete(NoAction)` or `Restrict`. Prevents tenant deletion if children exist.
- **Document:** Add warning in ERD and `TenantManagementService` that tenant deletion requires manual cleanup.

**Recommendation:** Add FKs with `NoAction` (safest). Migration will fail if orphans exist — clean first.

**Effort:** M | **Risk:** Medium (migration may need data cleanup) | **Files:**
- 8 configuration files (add `HasOne<Tenant>().WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.NoAction)`)
- New migration

---

### P1-5: Optimize `GenerateUniqueJoinCodeAsync`
**Problem:** `GroupService.GenerateUniqueJoinCodeAsync` loops up to 20× with `AnyAsync` — N round-trips.

**Fix:** Generate batch of codes, single `Where(c => codes.Contains(c.JoinCode))` query, pick first unused. Or rely on unique index + catch `DbUpdateException` + retry.

**Effort:** S | **Risk:** Low | **Files:**
- `GroupService.cs` (lines 480-490)

---

### P1-6: Add Currency Column for Money Fields
**Problem:** `Subject.Price`, `PaymentTransaction.Amount`, `Quiz.TotalScore`, `Submission.Score` are `decimal(18,2)` with no currency. Assumes EGP.

**Fix:** Add `Currency` char(3) column (ISO 4217) to relevant tables. Default 'EGP'.

**Effort:** S | **Risk:** Low | **Files:**
- `Subject.cs`, `PaymentTransaction.cs`, `Quiz.cs`, `Submission.cs`
- 4 configuration files
- New migration

---

### P1-7: Add CHECK Constraints for Enums
**Problem:** Enum columns (Role, ContentType, EnrollmentStatus, PaymentStatus) stored as `int` with no DB-level validation. Invalid values possible via SQL.

**Fix:** Add CHECK constraints in migration or via `HasCheckConstraint` in configurations.

**Effort:** S | **Risk:** Low | **Files:**
- `UserConfiguration.cs` (Role IN (1,2,3))
- `LessonConfiguration.cs` (ContentType IN (1..5))
- `EnrollmentConfiguration.cs` (Status IN (1..4))
- `PaymentTransactionConfiguration.cs` (Status IN (1..4))
- New migration

---

### P1-8: Fix SubjectDetail In-Memory Filter
**Problem:** `SubjectService.GetSubjectDetailAsync` loads all lessons via `Include`, then filters in memory (`MapDetail` line 483-488). Wastes bandwidth for subjects with many draft lessons.

**Fix:** Use projection with conditional include or separate query for lessons.

**Effort:** S | **Risk:** Low | **Files:**
- `SubjectService.cs` (GetSubjectDetailAsync, MapDetail)

---

## P2 — Technical Debt & Polish

### P2-1: Structured Logging (Serilog + JSON)
**Problem:** Default `ILogger` outputs plain text. Hard to query in log aggregation (Seq, ELK, Loki).

**Fix:** Add Serilog, configure JSON output, enrich with correlation ID, tenant ID, user ID.

**Effort:** M | **Risk:** Low | **Files:**
- `Program.cs`
- `TeacherAssistant.API.csproj` (add Serilog packages)
- `appsettings.json` (Serilog config)

---

### P2-2: Audit Log for Security Events
**Problem:** No audit trail for: login success/failure, password reset, tenant branding changes, group code regeneration, student removal.

**Fix:** Create `AuditLog` entity + `IAuditLogger` service. Call from:
- `AuthService.LoginAsync` / `Register*`
- `StudentService.ResetPasswordAsync`
- `TenantManagementService.UpdateCurrentAsync`
- `GroupService.RegenerateCodeAsync` / `ToggleCodeAsync` / `RemoveStudentAsync`

**Effort:** M | **Risk:** Low | **Files:**
- New `AuditLog.cs` entity + configuration
- New `IAuditLogger` + implementation
- Service files above
- New migration

---

### P2-3: Rate Limit Rejection Logging
**Problem:** 429 responses not logged. Can't detect abuse.

**Fix:** Custom `OnRejected` handler in rate limiter options → log warning with IP, path, partition key.

**Effort:** S | **Risk:** Low | **Files:**
- `Program.cs` (rate limiter configuration)

---

### P2-4: API Versioning Strategy
**Problem:** Routes hardcoded as `/api/v1/...`. No versioning middleware.

**Fix:** Add `Microsoft.AspNetCore.Mvc.Versioning` or minimal `MapGroup("api/v1")` with future-proofing.

**Effort:** S | **Risk:** Low | **Files:**
- `Program.cs`
- Controllers (attribute cleanup)

---

### P2-5: Health Checks
**Problem:** No `/health` endpoint for orchestration (K8s, container probes).

**Fix:** Add `AddHealthChecks()` with DB connectivity check.

**Effort:** S | **Risk:** Low | **Files:**
- `Program.cs`
- `TeacherAssistant.API.csproj` (add HealthChecks packages)

---

### P2-6: Request Body Size Limits
**Problem:** No explicit limit on request body. `RateLimitPartitionMiddleware` reads entire login body into memory.

**Fix:** Add `RequestSizeLimit` middleware or Kestrel limits.

**Effort:** S | **Risk:** Low | **Files:**
- `Program.cs`

---

### P2-7: Input Sanitization on Rich Text Fields
**Problem:** `Subject.Description`, `Lesson.Description`, `Tenant.Bio`, `Submission.Feedback` accept raw text. No XSS protection if rendered in web UI.

**Fix:** Document that API returns raw text; frontend must sanitize on render. Or add server-side sanitization (HtmlSanitizer) on write.

**Effort:** S | **Risk:** Low | **Files:**
- Service create/update methods (if server-side)
- `README.md` / `API_CONTRACT.md` (documentation)

---

## Action Summary Table

| ID | Title | Priority | Effort | Risk | Est. Days |
|----|-------|----------|--------|------|-----------|
| P0-1 | Platform Admin Email Unique Index | P0 | S | Low | 0.5 |
| P0-2 | Remove Join Codes from Seed Logs | P0 | S | Low | 0.5 |
| P0-3 | Add Pagination to List Endpoints | P0 | M | Medium | 2 |
| P0-4 | Correlation ID in Logs/Errors | P0 | S | Low | 0.5 |
| P1-1 | Document/Drop Phase 2 Tables | P1 | S/M | Low/Med | 0.5–2 |
| P1-2 | Soft Delete on Subject | P1 | M | Medium | 2 |
| P1-3 | Soft Delete on User | P1 | M | Medium | 2 |
| P1-4 | FKs to Tenant Table | P1 | M | Medium | 1 |
| P1-5 | Optimize Join Code Generation | P1 | S | Low | 0.5 |
| P1-6 | Currency Column for Money | P1 | S | Low | 0.5 |
| P1-7 | CHECK Constraints for Enums | P1 | S | Low | 0.5 |
| P1-8 | Fix SubjectDetail Lesson Filter | P1 | S | Low | 0.5 |
| P2-1 | Structured Logging (Serilog) | P2 | M | Low | 1 |
| P2-2 | Audit Log for Security Events | P2 | M | Low | 2 |
| P2-3 | Rate Limit Rejection Logging | P2 | S | Low | 0.5 |
| P2-4 | API Versioning | P2 | S | Low | 0.5 |
| P2-5 | Health Checks | P2 | S | Low | 0.5 |
| P2-6 | Request Body Size Limits | P2 | S | Low | 0.5 |
| P2-7 | Input Sanitization Docs | P2 | S | Low | 0.5 |

---

## Suggested Execution Order

1. **Week 1 (P0):** P0-1, P0-2, P0-4, P1-5, P1-6, P1-7, P1-8 (all S, low risk)
2. **Week 2 (P0 + P1):** P0-3 (pagination — biggest API change), P1-1 (decide Phase 2 fate)
3. **Week 3 (P1):** P1-2, P1-3 (soft deletes — schema changes), P1-4 (FKs to Tenant)
4. **Week 4 (P2):** P2-1 through P2-7 (observability, operations, polish)

---

## Files Most Likely to Change

| File | Changes Expected |
|------|------------------|
| `ApplicationDbContext.cs` | Tenant isolation extensions, soft delete filters |
| `SubjectService.cs` | Pagination, soft delete, projection fix |
| `GroupService.cs` | Pagination, join code optimization |
| `AuthService.cs` | Soft delete check on login |
| `DatabaseSeeder.cs` | Log sanitization |
| `UserConfiguration.cs` + 8 others | FK to Tenant, CHECK constraints |
| `Program.cs` | Correlation ID, Serilog, HealthChecks, RateLimit logging |
| New migrations | 5–8 migrations for schema changes |