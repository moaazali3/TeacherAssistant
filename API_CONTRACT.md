# API Contract — Teacher Assistant LMS (Phase 3)

Base URL: `https://{host}/api/v1`

## Conventions

| Item | Value |
| --- | --- |
| Tenant | `X-Tenant: {subdomain}` header (or the subdomain in the host, e.g. `demo.localhost`) |
| Auth | `Authorization: Bearer {jwt}` |
| Content type | `application/json` unless noted |
| Canonical subject routes | `/api/v1/subjects` |
| Group routes | `/api/v1/groups` and `/api/v1/subjects/{subjectId}/groups` |

Every response uses the same envelope:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { },
  "errors": []
}
```

Validation failures return `400` with `"message": "Validation failed."` and a list of
human-readable strings in `errors`.

Auth roles: `Admin`, `Instructor`, `Student`. `InstructorOnly` and `StudentOnly` policies
return `403` for the wrong role; a missing/invalid token returns `401`.

Passwords for `register-teacher`, `register-student` and `reset-password` must be **8–100
characters and contain at least one letter and at least one digit**.

Brute-force protection is configured in the `RateLimiting` section of `appsettings.json`.
Exceeding a limit returns `429 Too Many Requests` with the usual `ApiResponse` envelope and
an Arabic `message`:

| Endpoint | Default limit |
| --- | --- |
| `POST /auth/login` | 5 attempts / minute per IP + email |
| `POST /auth/register-student` | 10 attempts / 10 minutes per IP |
| `POST /groups/join` | 10 attempts / 10 minutes per IP |
| `POST /auth/register-teacher` | 20 requests / 10 minutes per IP |
| `GET /tenants/check-subdomain` | 20 requests / 10 minutes per IP |

> Enums are serialized as **numbers**: `UserRole` = `Instructor: 1`, `Student: 2`, `Admin: 3`;
> `ContentType` = `Video: 1`, `Pdf: 2`, `Word: 3`, `Article: 4`, `Link: 5`.

---

## 1. Auth

### POST `/auth/register-teacher` (anonymous, platform domain)

```json
{
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "password": "Password@123",
  "subdomain": "ahmed",
  "tenantName": "Ahmed Academy",
  "logoUrl": "https://cdn.example.com/logo.png",
  "primaryColor": "#0F766E",
  "bio": "Math and physics teacher"
}
```

`password` follows the shared password rule (8–100 characters, at least one letter and one
digit). Returns `429` after the per-IP public limit is exceeded.

`200 OK`

```json
{
  "success": true,
  "message": "Teacher account created successfully.",
  "data": {
    "userId": "6f0b6a4e-...",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "role": 1,
    "tenantId": "0e0d7b2a-...",
    "tenantSubdomain": "ahmed",
    "token": "eyJhbGciOi...",
    "expiresAt": "2026-11-18T10:00:00Z"
  },
  "errors": []
}
```

### POST `/auth/register-student` (anonymous, tenant required)

`joinCode` is **required**. It must reference an active, open group of the tenant.

```json
{
  "name": "Sara Mohamed",
  "email": "sara@example.com",
  "password": "Password@123",
  "joinCode": "SAT5CHEM"
}
```

`200 OK` — same `AuthResponseDto` envelope, `"role": 2`. The student account and the
group membership are created together (single `SaveChanges`, one transaction).

| Status | When | `message` |
| --- | --- | --- |
| `400` | missing/invalid format | `Validation failed.` |
| `400` | code does not exist **in this tenant** | `Invalid join code. Ask your teacher for the correct group code.` |
| `400` | `IsCodeActive == false` | `This join code is no longer active. Ask your teacher for a new code.` |
| `400` | `IsOpen == false` | `This group is not accepting new students.` |
| `400` | email already used in the tenant | `An account with this email already exists in this platform.` |
| `429` | more than 10 join-code attempts from one IP in 10 minutes | Arabic rate-limit message |

`password` follows the shared password rule (8–100 characters, at least one letter and one
digit).

### POST `/auth/login` (anonymous, tenant required)

```json
{ "email": "sara@example.com", "password": "Password@123" }
```

`200 OK` with `AuthResponseDto`, `401` for invalid credentials, and `429` after 5 attempts
for the same IP + email within one minute (the `message` is in Arabic).

---

## 2. Subjects

All subject endpoints live under `/api/v1/subjects`.

### GET `/subjects` (anonymous)

Published subjects of the tenant.
Anonymous/Instructor: all published subjects. **Student: only subjects where the student has a
group membership** (still limited to published subjects).

```json
{
  "success": true,
  "message": "Subjects fetched successfully.",
  "data": [
    {
      "id": "b1e1c2a0-...",
      "title": "Chemistry",
      "description": "Organic chemistry for SAT",
      "thumbnailUrl": "https://cdn.example.com/chem.png",
      "isPublished": true,
      "lessonsCount": 12,
      "createdAt": "2026-11-17T09:00:00Z"
    }
  ],
  "errors": []
}
```

### GET `/subjects/mine` (Instructor)

All subjects owned by the caller, drafts included (`SubjectSummaryDto[]`).

### POST `/subjects` (Instructor)

```json
{
  "title": "Physics",
  "description": "Mechanics and waves",
  "thumbnailUrl": "https://cdn.example.com/physics.png",
  "isPublished": true
}
```

`201 Created` → `SubjectSummaryDto`.

### GET `/subjects/{id}` (anonymous)

`SubjectDetailDto`; lessons are **summaries only** (`contentUrl` is never included).
The owner sees drafts; a student must be a member (otherwise `404`); non-owners only see
published subjects (`404` when unpublished).

```json
{
  "success": true,
  "message": "Subject fetched successfully.",
  "data": {
    "id": "b1e1c2a0-...",
    "instructorId": "4a9f0c11-...",
    "instructorName": "Ahmed Ali",
    "title": "Chemistry",
    "description": "Organic chemistry for SAT",
    "thumbnailUrl": "https://cdn.example.com/chem.png",
    "isPublished": true,
    "createdAt": "2026-11-17T09:00:00Z",
    "updatedAt": null,
    "lessons": [
      {
        "id": "8c7a2f90-...",
        "title": "Introduction",
        "description": "Subject overview",
        "contentType": 1,
        "sortOrder": 1,
        "isPublished": true
      }
    ]
  },
  "errors": []
}
```

### PUT `/subjects/{id}` (Instructor, owner) → `200` with `SubjectDetailDto`

Body: `title`, `description`, `thumbnailUrl`, `isPublished`. Non-owner → `403`.

### DELETE `/subjects/{id}` (Instructor, owner)

`200 OK`, `data` = deleted id (lessons, groups, memberships and enrollments cascade).
Non-owner → `403`.

### POST `/subjects/{id}/lessons` (Instructor, owner) → `201` with `LessonDto`

```json
{
  "title": "Introduction",
  "description": "Subject overview",
  "contentType": 1,
  "contentUrl": "https://www.youtube.com/watch?v=abc123",
  "isPublished": true
}
```

`contentType` (number): `1` Video, `2` Pdf, `3` Word, `4` Article, `5` Link. `contentUrl` must be absolute http/https,
otherwise `400`.

### PUT `/subjects/{id}/lessons/reorder` (Instructor, owner)

```json
{ "lessonIds": ["8c7a2f90-...", "1d2e3f40-..."] }
```

`200` with the reordered `LessonSummaryDto[]`; `400` if the list is incomplete, duplicated or
contains a lesson of another subject.

---

## 3. Lessons

### GET `/lessons/{id}` (authenticated)

Returns the full `LessonDto` including `contentUrl` when:

- the caller owns the subject (Instructor), or
- the caller is a **Student who is a member** of the subject, and both the subject and the
  lesson are published.

Otherwise `404` (outsiders), `401` (anonymous), `403` (token from another tenant).

```json
{
  "success": true,
  "message": "Lesson fetched successfully.",
  "data": {
    "id": "8c7a2f90-...",
    "subjectId": "b1e1c2a0-...",
    "subjectTitle": "Chemistry",
    "title": "Introduction",
    "description": "Subject overview",
    "contentType": 1,
    "contentUrl": "https://www.youtube.com/watch?v=abc123",
    "sortOrder": 1,
    "isPublished": true
  },
  "errors": []
}
```

### PUT `/lessons/{id}` (Instructor, owner) → `200` with `LessonDto`
### DELETE `/lessons/{id}` (Instructor, owner) → `200`, `data` = deleted id

---

## 4. Groups (Instructor)

All group-management endpoints require `InstructorOnly` **and ownership of the subject**.
A teacher of the same tenant who does not own the subject gets `403`; a teacher of another
tenant gets `404` (the tenant filter hides the row).

### `GroupDto`

```json
{
  "id": "d3a4f5b6-...",
  "subjectId": "b1e1c2a0-...",
  "subjectTitle": "Chemistry",
  "name": "Saturday 5pm",
  "scheduleText": "Saturdays 17:00-19:00",
  "joinCode": "SAT5CHEM",
  "isCodeActive": true,
  "isOpen": true,
  "studentsCount": 12,
  "createdAt": "2026-11-17T09:05:00Z"
}
```

### GET `/subjects/{subjectId}/groups`

`200 OK` → `GroupDto[]` ordered by name.

### POST `/subjects/{subjectId}/groups`

```json
{
  "name": "Saturday 5pm",
  "scheduleText": "Saturdays 17:00-19:00",
  "isOpen": true
}
```

`201 Created` → `GroupDto`. `joinCode` is generated server-side
(8 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, unique per tenant).

### PUT `/groups/{id}` (owner)

```json
{
  "name": "Saturday morning",
  "scheduleText": "Saturdays 11:00-13:00",
  "isOpen": true
}
```

`200 OK` → `GroupDto`.

### DELETE `/groups/{id}` (owner)

`200 OK`, `data` = deleted id. Memberships cascade; student accounts are kept.

### POST `/groups/{id}/regenerate-code` (owner)

Generates a new unique code and re-activates it. `200 OK` → `GroupDto` with the new `joinCode`.
The previous code stops working immediately.

### POST `/groups/{id}/toggle-code` (owner)

Flips `isCodeActive`. `200 OK` → `GroupDto`.

### GET `/groups/{id}/students` (owner)

`200 OK`

```json
{
  "success": true,
  "message": "Students fetched successfully.",
  "data": [
    {
      "groupId": "d3a4f5b6-...",
      "groupName": "Saturday 5pm",
      "studentId": "7e8f9a0b-...",
      "name": "Sara Mohamed",
      "email": "sara@example.com",
      "joinedAt": "2026-11-17T10:15:00Z"
    }
  ],
  "errors": []
}
```

### PUT `/groups/{id}/students/{studentId}/move` (owner)

```json
{ "targetGroupId": "e4b5c6d7-..." }
```

`200 OK` → `GroupMemberDto` of the target group.

| Status | When |
| --- | --- |
| `400` | `targetGroupId` missing, target group not found, or target belongs to another subject |
| `404` | student is not a member of `{id}` |

### DELETE `/groups/{id}/students/{studentId}` (owner)

Removes the membership (student keeps their account). `200 OK`, `data` = student id.

---

## 5. Groups (Student)

### POST `/groups/join` (Student)

```json
{ "code": "MND7CHEM" }
```

`201 Created`

```json
{
  "success": true,
  "message": "Joined the group successfully.",
  "data": {
    "groupId": "d3a4f5b6-...",
    "groupName": "Monday 7pm",
    "scheduleText": "Mondays 19:00-21:00",
    "subjectId": "b1e1c2a0-...",
    "subjectTitle": "Chemistry",
    "instructorName": "Ahmed Ali",
    "joinedAt": "2026-11-17T10:20:00Z"
  },
  "errors": []
}
```

| Status | When | `message` |
| --- | --- | --- |
| `400` | malformed code | `Join code must be 8 characters (letters and digits).` |
| `400` | unknown code | `Invalid join code.` |
| `400` | code inactive | `This join code is no longer active.` |
| `400` | group closed | `This group is not accepting new students.` |
| `409` | already in a group of the same subject | `You already joined a group in this subject.` |
| `429` | more than 10 join-code attempts from one IP in 10 minutes | Arabic rate-limit message |

### GET `/groups/mine` (Student)

`200 OK` → `MyGroupDto[]` (one entry per subject the student joined).

```json
{
  "success": true,
  "message": "Your groups fetched successfully.",
  "data": [
    {
      "groupId": "d3a4f5b6-...",
      "groupName": "Saturday 5pm",
      "scheduleText": "Saturdays 17:00-19:00",
      "subjectId": "b1e1c2a0-...",
      "subjectTitle": "Chemistry",
      "instructorName": "Ahmed Ali",
      "joinedAt": "2026-11-17T10:15:00Z"
    }
  ],
  "errors": []
}
```

Instructors calling this endpoint get `403`.

---

## 6. Students (Instructor)

### POST `/students/{id}/reset-password` (Instructor)

```json
{ "newPassword": "FreshPass@123" }
```

`200 OK`, `data` = student id. The student must be a `Student` of the caller's tenant;
otherwise `404`. `newPassword` must be 8–100 characters and contain at least one letter and
one digit. Students get `403`.

```json
{
  "success": true,
  "message": "Student password reset successfully.",
  "data": "7e8f9a0b-...",
  "errors": []
}
```

---

## 7. Tenant branding

| Method | Route | Auth |
| --- | --- | --- |
| GET | `/tenants/check-subdomain?name=demo` | anonymous (20 requests / 10 minutes per IP) |
| GET | `/tenants/current` | anonymous |
| PUT | `/tenants/current` | Instructor of the resolved tenant |

`PUT /tenants/current` only updates the tenant resolved from `X-Tenant`/the subdomain, and
only when the `tenantId` claim in the caller's JWT matches that tenant. A teacher of tenant A
calling it with tenant B gets `403` and tenant B is not modified. A missing tenant or a
missing/mismatched tenant claim is also `403`.

---

## 8. Status-code summary

| Code | Meaning |
| --- | --- |
| `200` | success |
| `201` | created (subject, lesson, group, join) |
| `400` | validation error, invalid/inactive join code, invalid move |
| `401` | missing/invalid token, or a tenant token used on another tenant (except branding updates, which return `403`) |
| `403` | wrong role, not the owner of the subject/group, or branding update for another tenant |
| `404` | not found in the current tenant, or content the student cannot access |
| `409` | the student already has a group in that subject |
| `429` | a configured brute-force limit was exceeded (see the `RateLimiting` table above) |
