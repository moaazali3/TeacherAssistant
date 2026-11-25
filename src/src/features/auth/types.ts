/**
 * User roles defined by the backend (UserRole enum)
 * 1 = Instructor, 2 = Student, 3 = Admin, 4 = Assistant
 */
export type UserRole = 'Instructor' | 'Student' | 'Admin' | 'Assistant';

export const ASSISTANT_PERMISSIONS = {
  NONE: 0,
  VIEW_STUDENT_PROGRESS: 1,
  MANAGE_GROUPS: 2,
  MANAGE_CONTENT: 4,
  MANAGE_ASSESSMENTS: 8,
  ALL: 15,
} as const;

export type Gender = 'Male' | 'Female';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: number;
  tenantId?: string | null;
  tenantSubdomain?: string | null;
}

export function hasStaffPermission(user: User | null | undefined, permission: number): boolean {
  if (!user) return false;
  if (user.role === 'Instructor' || user.role === 'Admin') return true;
  if (user.role === 'Assistant') {
    return ((user.permissions ?? 0) & permission) === permission;
  }
  return false;
}

export interface AuthResponseDto {
  userId: string;
  name: string;
  email: string;
  role: UserRole | number;
  permissions?: number;
  tenantId?: string | null;
  tenantSubdomain?: string | null;
  token: string;
  expiresAt: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterTeacherRequestDto {
  name: string;
  email: string;
  password: string;
  subdomain: string;
  tenantName?: string;
  logoUrl?: string;
  primaryColor?: string;
  bio?: string;
}

export interface RegisterStudentRequestDto {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  dateOfBirth: string;
  gender: Gender;
  joinCode: string;
}
