import { apiClient, ApiResponse } from '@/lib/api';
import { InitiateLessonPaymentDto, LessonPaymentSessionDto } from './types';

export const paymentsApi = {
  initiateLessonPayment: async (
    lessonId: string,
    dto: InitiateLessonPaymentDto
  ): Promise<LessonPaymentSessionDto> => {
    const res = await apiClient.post<ApiResponse<LessonPaymentSessionDto>>(
      `/payments/lessons/${lessonId}/initiate`,
      dto
    );
    return res.data.data!;
  },

  confirmMockPurchase: async (purchaseId: string): Promise<LessonPaymentSessionDto> => {
    const res = await apiClient.post<ApiResponse<LessonPaymentSessionDto>>(
      `/payments/purchases/${purchaseId}/confirm-mock`
    );
    return res.data.data!;
  },

  getMyPurchases: async (): Promise<LessonPaymentSessionDto[]> => {
    const res = await apiClient.get<ApiResponse<LessonPaymentSessionDto[]>>(
      '/payments/my-purchases'
    );
    return res.data.data || [];
  },
};
