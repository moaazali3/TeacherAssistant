export interface AssistantDto {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  permissions: number;
  createdAt: string;
}

export interface CreateAssistantDto {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  permissions: number;
}

export interface UpdateAssistantPermissionsDto {
  permissions: number;
}

export const PERMISSION_OPTIONS = [
  {
    value: 1,
    label: 'متابعة الطلاب ودرجاتهم',
    description: 'الاطلاع على بيانات الطلاب، الدرجات، الامتحانات، وأرقام أولياء الأمور',
  },
  {
    value: 2,
    label: 'إدارة الجروبات والطلاب',
    description: 'نقل أو إزالة الطلاب بين المجموعات وإعادة تعيين كلمات المرور',
  },
  {
    value: 4,
    label: 'إدارة المحتوى والمحاضرات',
    description: 'رفع وتعديل المحاضرات والمواد الدراسية',
  },
  {
    value: 8,
    label: 'إدارة الامتحانات والواجبات',
    description: 'إنشاء وتصحيح الاختبارات والواجبات',
  },
] as const;
