import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { getTenantSlug, tenantPath, platformPath } from './tenant';

/**
 * Unified API Response structure matching the backend's ApiResponse<T>
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5014/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * 1. Attaches X-Tenant header when a tenant slug is resolved from the URL/subdomain,
 *    or from the logged-in instructor's tenantSubdomain when managing from the platform control panel.
 * 2. Attaches JWT Bearer token from localStorage when available.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let slug = getTenantSlug();

    // If on the platform domain (no slug in host/path), check if a logged-in instructor owns a tenant
    if (!slug) {
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user?.tenantSubdomain) {
            slug = user.tenantSubdomain;
          }
        }
      } catch {
        // ignore parsing errors
      }
    }

    if (slug) {
      config.headers['X-Tenant'] = slug;
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * 1. On 429 Too Many Requests:
 *    - Displays a sonner toast with Arabic text ("محاولات كتير، حاول بعد دقيقة" or backend message).
 *    - Dispatches 'api:rate-limited' window event to trigger 30s cooldowns on relevant forms.
 * 2. On 401 Unauthorized:
 *    - Clears session credentials from localStorage.
 *    - Dispatches a custom event to notify React AuthContext.
 *    - Redirects to the appropriate login page.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    // Global 429 handling
    if (error.response?.status === 429) {
      const serverMsg = error.response.data?.message;
      const message =
        typeof serverMsg === 'string' && serverMsg.trim().length > 0
          ? serverMsg.trim()
          : 'محاولات كتير، حاول بعد دقيقة';

      toast.error(message, {
        id: 'global-rate-limit-toast',
        duration: 6000,
      });

      // Dispatch global rate limit event with 30s cooldown parameter
      window.dispatchEvent(
        new CustomEvent('api:rate-limited', {
          detail: {
            message,
            cooldownSeconds: 30,
            url: error.config?.url,
          },
        })
      );
    }

    // Global 401 handling
    if (error.response?.status === 401) {
      let wasTeacher = false;
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          wasTeacher = user?.role === 'Instructor' || user?.role === 2 || user?.role === 'Admin' || user?.role === 1;
        }
      } catch {
        // ignore
      }

      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Dispatch custom event so AuthProvider can sync state without a hard reload
      window.dispatchEvent(new Event('auth:unauthorized'));

      const currentPath = window.location.pathname;
      const isAlreadyOnAuthPage =
        currentPath.includes('/login') ||
        currentPath.includes('/register');

      if (!isAlreadyOnAuthPage) {
        const slug = getTenantSlug();
        const loginUrl = slug ? tenantPath('/login') : (wasTeacher ? platformPath('/teacher/login') : platformPath('/'));
        window.location.href = loginUrl;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to extract human-readable Arabic error messages from backend responses.
 */
export function getApiErrorMessage(error: unknown, fallback = 'حدث خطأ أثناء تنفيذ الطلب. يرجى المحاولة مرة أخرى.'): string {
  if (axios.isAxiosError(error)) {
    const apiResponse = error.response?.data as ApiResponse | undefined;
    if (apiResponse) {
      if (apiResponse.errors && apiResponse.errors.length > 0) {
        return apiResponse.errors.join(' | ');
      }
      if (apiResponse.message) {
        return apiResponse.message;
      }
    }
    if (error.message === 'Network Error') {
      return 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل الخادم والاتصال بالإنترنت.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export { applyServerValidationErrors } from './form-errors';
export { useRateLimitCooldown } from './useRateLimitCooldown';
