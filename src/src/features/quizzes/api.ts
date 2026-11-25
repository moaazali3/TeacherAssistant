import { apiClient, ApiResponse } from '@/lib/api';
import {
  CreateQuizDto,
  QuizDetailDto,
  QuizSummaryItemDto,
  StudentQuizSubmissionSummaryDto,
  SubmitQuizAnswersDto,
} from './types';

export const quizzesApi = {
  getSubjectQuizzes: async (subjectId: string): Promise<QuizSummaryItemDto[]> => {
    const res = await apiClient.get<ApiResponse<QuizSummaryItemDto[]>>(
      `/subjects/${subjectId}/quizzes`
    );
    return res.data.data || [];
  },

  createQuiz: async (subjectId: string, dto: CreateQuizDto): Promise<QuizDetailDto> => {
    const res = await apiClient.post<ApiResponse<QuizDetailDto>>(
      `/subjects/${subjectId}/quizzes`,
      dto
    );
    return res.data.data!;
  },

  getQuizDetail: async (quizId: string): Promise<QuizDetailDto> => {
    const res = await apiClient.get<ApiResponse<QuizDetailDto>>(`/quizzes/${quizId}`);
    return res.data.data!;
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    await apiClient.delete(`/quizzes/${quizId}`);
  },

  submitAnswers: async (
    quizId: string,
    dto: SubmitQuizAnswersDto
  ): Promise<StudentQuizSubmissionSummaryDto> => {
    const res = await apiClient.post<ApiResponse<StudentQuizSubmissionSummaryDto>>(
      `/quizzes/${quizId}/submit-answers`,
      dto
    );
    return res.data.data!;
  },
};
