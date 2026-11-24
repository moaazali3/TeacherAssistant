import { apiClient, ApiResponse } from '@/lib/api';
import { LandingPageConfig } from './types';

export const landingApi = {
  getLandingConfig: async (): Promise<LandingPageConfig> => {
    const res = await apiClient.get<ApiResponse<LandingPageConfig>>('/tenants/current/landing');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تحميل إعدادات الصفحة الرئيسية');
    }
    return res.data.data;
  },

  updateLandingConfig: async (config: LandingPageConfig): Promise<LandingPageConfig> => {
    const res = await apiClient.put<ApiResponse<LandingPageConfig>>('/tenants/current/landing', config);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل حفظ إعدادات الصفحة الرئيسية');
    }
    return res.data.data;
  },

  resetLandingConfig: async (): Promise<LandingPageConfig> => {
    const res = await apiClient.post<ApiResponse<LandingPageConfig>>('/tenants/current/landing/reset');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل استعادة الإعدادات الافتراضية');
    }
    return res.data.data;
  },
};
