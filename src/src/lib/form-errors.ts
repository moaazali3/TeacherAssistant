import axios from 'axios';
import { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import { ApiResponse } from './api';

export interface ServerValidationOptions<TFieldValues extends FieldValues> {
  fieldMap?: Record<string, Path<TFieldValues>>;
}

/**
 * Localizes common backend validation error strings into friendly Arabic.
 */
function localizeServerMessage(msg: string): string {
  const trimmed = msg.trim();

  // Password rules
  if (trimmed.includes('at least one letter and at least one digit') || trimmed.includes('at least one letter and one digit')) {
    return 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل ورقم واحد على الأقل.';
  }
  if (trimmed.includes('between 8 and 100 characters') || trimmed.includes('must be between 8 and 100')) {
    return 'كلمة المرور يجب أن تتكون من 8 إلى 100 حرف.';
  }
  if (trimmed.includes('Password field is required') || trimmed.includes('The Password field is required')) {
    return 'كلمة المرور مطلوبة.';
  }
  if (trimmed.includes('NewPassword field is required') || trimmed.includes('The NewPassword field is required')) {
    return 'كلمة المرور الجديدة مطلوبة.';
  }

  // Email rules
  if (trimmed.includes('account with this email already exists in this platform')) {
    return 'يوجد حساب مسجل بهذا البريد الإلكتروني في هذه المنصة بالفعل.';
  }
  if (trimmed.includes('account with this email already exists')) {
    return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
  }
  if (trimmed.includes('not a valid e-mail address') || trimmed.includes('valid email')) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }
  if (trimmed.includes('Email field is required')) {
    return 'البريد الإلكتروني مطلوب.';
  }
  if (trimmed.includes('Invalid email or password')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  // Subdomain rules
  if (trimmed.includes('subdomain is already taken')) {
    return 'اسم النطاق هذا محجوز بالفعل. يرجى اختيار اسم نطاق آخر.';
  }
  if (trimmed.includes('subdomain is reserved')) {
    return 'اسم النطاق هذا محجوز للنظام.';
  }
  if (trimmed.includes('Subdomains must be 3-63 characters')) {
    return 'اسم النطاق يجب أن يكون بين 3 و 63 حرفاً ويحتوي على أحرف وأرقام وشرطات فقط.';
  }

  // Join Code rules
  if (trimmed.includes('Invalid join code')) {
    return 'كود الجروب غير صحيح. تأكد من الكود مع معلمك.';
  }
  if (trimmed.includes('join code is no longer active')) {
    return 'كود الجروب هذا لم يعد نشطاً. اطلب كوداً جديداً من المعلم.';
  }
  if (trimmed.includes('not accepting new students')) {
    return 'هذه المجموعة لا تقبل طلاباً جدداً في الوقت الحالي.';
  }

  // Name rules
  if (trimmed.includes('Name field is required')) {
    return 'الاسم مطلوب.';
  }

  return trimmed;
}

/**
 * Determines which form field matches an error message string.
 */
function detectFieldFromMessage<TFieldValues extends FieldValues>(
  message: string,
  resolveField: (key: string) => Path<TFieldValues> | null
): { field: Path<TFieldValues>; message: string } | null {
  const lower = message.toLowerCase();

  // 1. Password / NewPassword
  if (lower.includes('newpassword')) {
    const f = resolveField('newpassword');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }
  if (lower.includes('password') || lower.includes('كلمة المرور')) {
    const f = resolveField('password') || resolveField('newpassword');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  // 2. Email
  if (lower.includes('email') || lower.includes('البريد')) {
    const f = resolveField('email');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  // 3. Subdomain
  if (lower.includes('subdomain') || lower.includes('النطاق')) {
    const f = resolveField('subdomain');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  // 4. Join code
  if (lower.includes('join code') || lower.includes('joincode') || lower.includes('كود')) {
    const f = resolveField('joincode');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  // 5. Name
  if (lower.includes('name field') || lower.includes('الاسم')) {
    const f = resolveField('name');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  // 6. Title / Description / URL
  if (lower.includes('title')) {
    const f = resolveField('title');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }
  if (lower.includes('description')) {
    const f = resolveField('description');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }
  if (lower.includes('url') || lower.includes('contenturl') || lower.includes('thumbnailurl')) {
    const f = resolveField('contenturl') || resolveField('thumbnailurl');
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  // Check prefix format like "FieldName: Error" or "FieldName is invalid."
  const prefixMatch = message.match(/^([a-zA-Z0-9_]+)\s*(?::|\s+is\s+invalid)/);
  if (prefixMatch && prefixMatch[1]) {
    const f = resolveField(prefixMatch[1]);
    if (f) return { field: f, message: localizeServerMessage(message) };
  }

  return null;
}

/**
 * Maps backend 400 validation errors (from ModelState dictionary, ApiResponse.errors array,
 * or business failure messages) to React Hook Form fields.
 * Returns the unhandled error message (if any), or null if all errors were matched and set.
 */
export function applyServerValidationErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  options?: ServerValidationOptions<TFieldValues>
): string | null {
  if (!axios.isAxiosError(error) || !error.response) {
    if (error instanceof Error) return error.message;
    return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  }

  const { status, data } = error.response as { status: number; data?: ApiResponse & { errors?: unknown } };

  // Only handle 400 Bad Request or 422 Unprocessable Entity
  if (status !== 400 && status !== 422) {
    return null;
  }

  if (!data) {
    return 'بيانات الطلب غير صالحة.';
  }

  let mappedCount = 0;
  const unhandledMessages: string[] = [];

  const fieldMap = options?.fieldMap || {};

  const resolveField = (key: string): Path<TFieldValues> | null => {
    const rawKey = key.trim();
    const normalizedKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (fieldMap[rawKey]) return fieldMap[rawKey];
    if (fieldMap[normalizedKey]) return fieldMap[normalizedKey];

    const standardMapping: Record<string, string> = {
      email: 'email',
      password: 'password',
      newpassword: 'newPassword',
      name: 'name',
      subdomain: 'subdomain',
      tenantname: 'tenantName',
      joincode: 'joinCode',
      code: 'joinCode',
      title: 'title',
      description: 'description',
      thumbnailurl: 'thumbnailUrl',
      contenturl: 'contentUrl',
      contenttype: 'contentType',
      primarycolor: 'primaryColor',
      scheduletext: 'scheduleText',
    };

    const target = standardMapping[normalizedKey] || normalizedKey;
    return target as Path<TFieldValues>;
  };

  // 1. data.errors is an object: { [field: string]: string[] | string } (ASP.NET ValidationProblemDetails)
  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const errorEntries = Object.entries(data.errors as Record<string, unknown>);
    for (const [rawField, messages] of errorEntries) {
      const field = resolveField(rawField);
      const msgList = Array.isArray(messages) ? messages : [messages];
      const combined = msgList.filter(Boolean).map(String).join(' | ');

      if (field && combined) {
        setError(field, { type: 'server', message: localizeServerMessage(combined) });
        mappedCount++;
      } else if (combined) {
        unhandledMessages.push(combined);
      }
    }
  }

  // 2. data.errors is an array: string[] (ApiResponse.errors from InvalidModelStateResponseFactory)
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    for (const errItem of data.errors) {
      if (typeof errItem !== 'string') continue;
      const detected = detectFieldFromMessage(errItem, resolveField);
      if (detected) {
        setError(detected.field, { type: 'server', message: detected.message });
        mappedCount++;
      } else {
        unhandledMessages.push(errItem);
      }
    }
  }

  // 3. Single business message in data.message
  if (data.message && typeof data.message === 'string' && mappedCount === 0) {
    const detected = detectFieldFromMessage(data.message, resolveField);
    if (detected) {
      setError(detected.field, { type: 'server', message: detected.message });
      mappedCount++;
    } else if (data.message !== 'Validation failed.') {
      unhandledMessages.push(localizeServerMessage(data.message));
    }
  }

  if (unhandledMessages.length > 0) {
    return unhandledMessages.join(' | ');
  }

  return mappedCount > 0 ? null : (data.message || 'بيانات النموذج غير صحيحة.');
}
