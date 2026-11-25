import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  User,
  UserRole,
  AuthResponseDto,
  LoginRequestDto,
  RegisterTeacherRequestDto,
  RegisterStudentRequestDto,
} from './types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<AuthResponseDto>;
  registerTeacher: (dto: RegisterTeacherRequestDto) => Promise<AuthResponseDto>;
  registerStudent: (dto: RegisterStudentRequestDto) => Promise<AuthResponseDto>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Normalizes backend role representation (number or string) to UserRole
 */
function normalizeRole(role: UserRole | number | string): UserRole {
  if (role === 1 || role === '1' || role === 'Instructor') return 'Instructor';
  if (role === 2 || role === '2' || role === 'Student') return 'Student';
  if (role === 3 || role === '3' || role === 'Admin') return 'Admin';
  if (role === 4 || role === '4' || role === 'Assistant') return 'Assistant';
  return 'Student';
}

/**
 * Parses JWT token payload safely without external dependencies
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        // Validate token expiration if possible
        const payload = decodeJwt(storedToken);
        if (payload && typeof payload.exp === 'number') {
          const isExpired = Date.now() >= payload.exp * 1000;
          if (isExpired) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }

        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }

    // Listen for unauthorized events triggered by axios interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleAuthSuccess = useCallback((authData: AuthResponseDto) => {
    const role = normalizeRole(authData.role);
    const resolvedUser: User = {
      id: authData.userId,
      name: authData.name,
      email: authData.email,
      role,
      permissions: authData.permissions ?? (role === 'Instructor' || role === 'Admin' ? 15 : 0),
      tenantId: authData.tenantId,
      tenantSubdomain: authData.tenantSubdomain,
    };

    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('auth_user', JSON.stringify(resolvedUser));
    setToken(authData.token);
    setUser(resolvedUser);
    return authData;
  }, []);

  const login = useCallback(
    async (dto: LoginRequestDto) => {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/login', dto);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'فشل تسجيل الدخول');
      }
      return handleAuthSuccess(response.data.data);
    },
    [handleAuthSuccess]
  );

  const registerTeacher = useCallback(
    async (dto: RegisterTeacherRequestDto) => {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/register-teacher', dto);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'فشل إنشاء حساب المعلم');
      }
      return handleAuthSuccess(response.data.data);
    },
    [handleAuthSuccess]
  );

  const registerStudent = useCallback(
    async (dto: RegisterStudentRequestDto) => {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/register-student', dto);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'فشل إنشاء حساب الطالب');
      }
      return handleAuthSuccess(response.data.data);
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        registerTeacher,
        registerStudent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
