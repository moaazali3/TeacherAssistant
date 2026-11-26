export type AssessmentType = 'Homework' | 'Exam';
export type AssessmentPlacement = 'AfterLesson' | 'BeforeLesson' | 'General';

export interface QuizQuestionDto {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex?: number | null;
  points: number;
}

export interface StudentQuizSubmissionSummaryDto {
  submissionId: string;
  score?: number | null;
  totalScore: number;
  percentage?: number | null;
  passed: boolean;
  feedback?: string | null;
  submittedAt: string;
  answers?: Record<string, number> | null;
}

export interface QuizSummaryItemDto {
  id: string;
  subjectId: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  title: string;
  type: AssessmentType | number;
  placement?: AssessmentPlacement | number;
  availableFrom?: string | null;
  dueAt?: string | null;
  durationMinutes?: number | null;
  passingScorePercent: number;
  isPublished: boolean;
  questionsCount: number;
  totalScore: number;
  submissionsCount: number;
  createdAt: string;
  mySubmission?: StudentQuizSubmissionSummaryDto | null;
}

export interface QuizDetailDto extends QuizSummaryItemDto {
  questions: QuizQuestionDto[];
}

export interface CreateQuizDto {
  title: string;
  lessonId?: string | null;
  type: AssessmentType;
  placement: AssessmentPlacement;
  availableFrom?: string | null;
  dueAt?: string | null;
  durationMinutes?: number | null;
  passingScorePercent: number;
  isPublished: boolean;
  questions: QuizQuestionDto[];
}

export interface SubmitQuizAnswersDto {
  answers: Record<string, number>;
}

export function normalizeAssessmentType(t: AssessmentType | number | string): AssessmentType {
  if (t === 2 || t === '2' || t === 'Exam') return 'Exam';
  return 'Homework';
}

export function normalizeAssessmentPlacement(
  p?: AssessmentPlacement | number | string | null
): AssessmentPlacement {
  if (p === 1 || p === '1' || p === 'BeforeLesson') return 'BeforeLesson';
  if (p === 2 || p === '2' || p === 'General') return 'General';
  return 'AfterLesson';
}
