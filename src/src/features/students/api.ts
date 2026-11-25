import { apiClient, ApiResponse } from '@/lib/api';
import { StudentProgressDto, StudentSummaryDto } from './types';

export const studentsApi = {
  getStudents: async (search?: string): Promise<StudentSummaryDto[]> => {
    const res = await apiClient.get<ApiResponse<StudentSummaryDto[]>>('/students', {
      params: search ? { search } : undefined,
    });
    return res.data.data || [];
  },

  getStudentProgress: async (studentId: string): Promise<StudentProgressDto> => {
    const res = await apiClient.get<ApiResponse<StudentProgressDto>>(
      `/students/${studentId}/progress`
    );
    return res.data.data!;
  },
};
