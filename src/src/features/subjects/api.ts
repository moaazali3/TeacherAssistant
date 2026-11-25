import { apiClient, ApiResponse } from '@/lib/api';
import {
  SubjectSummary,
  SubjectDetail,
  LessonDetail,
  LessonSummary,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
  contentTypeToNumber,
} from './types';

export const subjectsApi = {
  /**
   * GET /subjects/mine (Teacher only, includes drafts)
   */
  async getMySubjects(): Promise<SubjectSummary[]> {
    const res = await apiClient.get<ApiResponse<SubjectSummary[]>>('/subjects/mine');
    return res.data.data || [];
  },

  /**
   * GET /subjects (Public within tenant, published subjects only; students see joined subjects only)
   */
  async getPublishedSubjects(): Promise<SubjectSummary[]> {
    const res = await apiClient.get<ApiResponse<SubjectSummary[]>>('/subjects');
    return res.data.data || [];
  },

  /**
   * GET /subjects/{id} (Public/Teacher: subject info + lesson summaries without ContentUrl)
   */
  async getSubjectDetail(id: string): Promise<SubjectDetail> {
    const res = await apiClient.get<ApiResponse<SubjectDetail>>(`/subjects/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تحميل تفاصيل المادة');
    }
    return res.data.data;
  },

  /**
   * GET /subjects/{id} alias used by subject-scoped group pages.
   */
  async getById(id: string): Promise<SubjectDetail> {
    return this.getSubjectDetail(id);
  },

  /**
   * POST /subjects (Teacher only)
   */
  async createSubject(dto: CreateSubjectDto): Promise<SubjectSummary> {
    const res = await apiClient.post<ApiResponse<SubjectSummary>>('/subjects', dto);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل إنشاء المادة');
    }
    return res.data.data;
  },

  /**
   * PUT /subjects/{id} (Teacher only)
   */
  async updateSubject(id: string, dto: UpdateSubjectDto): Promise<SubjectDetail> {
    const res = await apiClient.put<ApiResponse<SubjectDetail>>(`/subjects/${id}`, dto);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تعديل المادة');
    }
    return res.data.data;
  },

  /**
   * DELETE /subjects/{id} (Teacher only)
   */
  async deleteSubject(id: string): Promise<string> {
    const res = await apiClient.delete<ApiResponse<string>>(`/subjects/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'فشل حذف المادة');
    }
    return id;
  },

  /**
   * POST /subjects/{id}/lessons (Teacher only)
   */
  async addLesson(subjectId: string, dto: CreateLessonDto): Promise<LessonDetail> {
    const payload = {
      ...dto,
      contentType: contentTypeToNumber(dto.contentType),
    };
    const res = await apiClient.post<ApiResponse<LessonDetail>>(`/subjects/${subjectId}/lessons`, payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل إضافة الدرس');
    }
    return res.data.data;
  },

  /**
   * PUT /lessons/{id} (Teacher only)
   */
  async updateLesson(lessonId: string, dto: UpdateLessonDto): Promise<LessonDetail> {
    const payload = {
      ...dto,
      contentType: contentTypeToNumber(dto.contentType),
    };
    const res = await apiClient.put<ApiResponse<LessonDetail>>(`/lessons/${lessonId}`, payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تعديل الدرس');
    }
    return res.data.data;
  },

  /**
   * DELETE /lessons/{id} (Teacher only)
   */
  async deleteLesson(lessonId: string): Promise<string> {
    const res = await apiClient.delete<ApiResponse<string>>(`/lessons/${lessonId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'فشل حذف الدرس');
    }
    return lessonId;
  },

  /**
   * PUT /subjects/{id}/lessons/reorder (Teacher only)
   */
  async reorderLessons(subjectId: string, lessonIds: string[]): Promise<LessonSummary[]> {
    const body: ReorderLessonsDto = { lessonIds };
    const res = await apiClient.put<ApiResponse<LessonSummary[]>>(`/subjects/${subjectId}/lessons/reorder`, body);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل إعادة ترتيب الدروس');
    }
    return res.data.data;
  },

  /**
   * GET /lessons/{id} (Logged-in user only, includes ContentUrl)
   */
  async getLessonDetail(lessonId: string): Promise<LessonDetail> {
    const res = await apiClient.get<ApiResponse<LessonDetail>>(`/lessons/${lessonId}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تحميل بيانات الدرس');
    }
    return res.data.data;
  },

  /**
   * POST /lessons/{id}/complete (Student only)
   */
  async completeLesson(lessonId: string): Promise<LessonDetail> {
    const res = await apiClient.post<ApiResponse<LessonDetail>>(`/lessons/${lessonId}/complete`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'فشل تسجيل إتمام المحاضرة');
    }
    return res.data.data;
  },
};
