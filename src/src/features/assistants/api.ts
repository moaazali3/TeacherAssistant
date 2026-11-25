import { apiClient, ApiResponse } from '@/lib/api';
import {
  AssistantDto,
  CreateAssistantDto,
  UpdateAssistantPermissionsDto,
} from './types';

export const assistantsApi = {
  getAll: async (): Promise<AssistantDto[]> => {
    const res = await apiClient.get<ApiResponse<AssistantDto[]>>('/assistants');
    return res.data.data || [];
  },

  create: async (dto: CreateAssistantDto): Promise<AssistantDto> => {
    const res = await apiClient.post<ApiResponse<AssistantDto>>('/assistants', dto);
    return res.data.data!;
  },

  updatePermissions: async (
    assistantId: string,
    dto: UpdateAssistantPermissionsDto
  ): Promise<AssistantDto> => {
    const res = await apiClient.put<ApiResponse<AssistantDto>>(
      `/assistants/${assistantId}/permissions`,
      dto
    );
    return res.data.data!;
  },

  delete: async (assistantId: string): Promise<void> => {
    await apiClient.delete(`/assistants/${assistantId}`);
  },
};
