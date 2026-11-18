import { apiClient, ApiResponse } from '@/lib/api';
import {
  GroupDto,
  GroupMemberDto,
  MyGroupDto,
  CreateGroupDto,
  UpdateGroupDto,
  MoveStudentDto,
  ResetStudentPasswordDto,
  JoinGroupDto,
} from './types';

export const groupsApi = {
  // Instructor: Get groups for a subject
  getSubjectGroups: async (subjectId: string): Promise<GroupDto[]> => {
    const res = await apiClient.get<ApiResponse<GroupDto[]>>(`/subjects/${subjectId}/groups`);
    return res.data.data || [];
  },

  // Instructor: Create a new group under a subject
  createGroup: async (subjectId: string, dto: CreateGroupDto): Promise<GroupDto> => {
    const res = await apiClient.post<ApiResponse<GroupDto>>(`/subjects/${subjectId}/groups`, dto);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل إنشاء المجموعة');
    }
    return res.data.data;
  },

  // Instructor: Update group
  updateGroup: async (groupId: string, dto: UpdateGroupDto): Promise<GroupDto> => {
    const res = await apiClient.put<ApiResponse<GroupDto>>(`/groups/${groupId}`, dto);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تحديث المجموعة');
    }
    return res.data.data;
  },

  // Instructor: Delete group
  deleteGroup: async (groupId: string): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<string>>(`/groups/${groupId}`);
    return res.data.message || 'تم حذف المجموعة بنجاح';
  },

  // Instructor: Regenerate code
  regenerateCode: async (groupId: string): Promise<GroupDto> => {
    const res = await apiClient.post<ApiResponse<GroupDto>>(`/groups/${groupId}/regenerate-code`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل إعادة توليد الكود');
    }
    return res.data.data;
  },

  // Instructor: Toggle code active/inactive
  toggleCode: async (groupId: string): Promise<GroupDto> => {
    const res = await apiClient.post<ApiResponse<GroupDto>>(`/groups/${groupId}/toggle-code`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تبديل حالة الكود');
    }
    return res.data.data;
  },

  // Instructor: Get students of a group
  getGroupStudents: async (groupId: string): Promise<GroupMemberDto[]> => {
    const res = await apiClient.get<ApiResponse<GroupMemberDto[]>>(`/groups/${groupId}/students`);
    return res.data.data || [];
  },

  // Instructor: Move student to another group in the same subject
  moveStudent: async (groupId: string, studentId: string, targetGroupId: string): Promise<GroupMemberDto> => {
    const payload: MoveStudentDto = { targetGroupId };
    const res = await apiClient.put<ApiResponse<GroupMemberDto>>(
      `/groups/${groupId}/students/${studentId}/move`,
      payload
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل نقل الطالب');
    }
    return res.data.data;
  },

  // Instructor: Remove student from group
  removeStudent: async (groupId: string, studentId: string): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<string>>(`/groups/${groupId}/students/${studentId}`);
    return res.data.message || 'تم حذف الطالب من المجموعة';
  },

  // Instructor: Reset student password
  resetStudentPassword: async (studentId: string, dto: ResetStudentPasswordDto): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>(`/students/${studentId}/reset-password`, dto);
    if (!res.data.success) {
      throw new Error(res.data.message || 'فشل إعادة تعيين كلمة المرور');
    }
    return res.data.message || 'تمت إعادة تعيين كلمة المرور بنجاح';
  },

  // Student: Get my joined groups
  getMyGroups: async (): Promise<MyGroupDto[]> => {
    const res = await apiClient.get<ApiResponse<MyGroupDto[]>>('/groups/mine');
    return res.data.data || [];
  },

  // Student: Join a group using join code
  joinGroup: async (code: string): Promise<MyGroupDto> => {
    const payload: JoinGroupDto = { code };
    const res = await apiClient.post<ApiResponse<MyGroupDto>>('/groups/join', payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل الانضمام إلى المجموعة');
    }
    return res.data.data;
  },
};
