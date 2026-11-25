import { Gender } from '@/features/auth/types';

export interface StudentSummaryDto {
  studentId: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  parentPhoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  groups: string[];
  completedQuizzesCount: number;
  totalQuizzesCount: number;
  averageScorePercentage?: number | null;
  lastSubmissionAt?: string | null;
  createdAt: string;
}

export interface StudentGroupSummaryDto {
  groupId: string;
  groupName: string;
  subjectTitle: string;
  joinedAt: string;
}

export interface StudentSubmissionItemDto {
  quizId: string;
  quizTitle: string;
  subjectTitle: string;
  score?: number | null;
  totalScore: number;
  percentage?: number | null;
  feedback?: string | null;
  submittedAt: string;
}

export interface PendingQuizItemDto {
  quizId: string;
  quizTitle: string;
  subjectTitle: string;
  totalScore: number;
}

export interface StudentProgressDto {
  studentId: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  parentPhoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  createdAt: string;
  totalQuizzesAvailable: number;
  completedQuizzes: number;
  pendingQuizzesCount: number;
  totalLessonsAvailable: number;
  completedLessonsCount: number;
  averageScorePercentage?: number | null;
  lastSubmissionAt?: string | null;
  groups: StudentGroupSummaryDto[];
  completedSubmissions: StudentSubmissionItemDto[];
  pendingQuizzes: PendingQuizItemDto[];
}

export function buildParentWhatsAppUrl(
  parentPhone: string | null | undefined,
  message: string
): string | null {
  if (!parentPhone) return null;
  let digits = parentPhone.replace(/[^0-9+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = `2${digits}`;
  } else if (digits.startsWith('0')) {
    digits = `20${digits.slice(1)}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
