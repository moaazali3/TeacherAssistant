/**
 * User roles defined by the backend (UserRole enum)
 * 1 = Instructor, 2 = Student, 3 = Admin
 */
export type UserRole = 'Instructor' | 'Student' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  tenantSubdomain?: string | null;
}

export interface AuthResponseDto {
  userId: string;
  name: string;
  email: string;
  role: UserRole | number;
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
  joinCode: string;
}
