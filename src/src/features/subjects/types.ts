export type ContentType = 'Video' | 'Pdf' | 'Word' | 'Article' | 'Link';

export interface SubjectSummary {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  lessonsCount: number;
  createdAt: string;
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string;
  contentType: ContentType | number;
  sortOrder: number;
  isPublished: boolean;
  moduleTitle?: string | null;
  availableAt?: string | null;
  requiresPreviousCompletion?: boolean;
  attachmentUrl?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
  isCompleted?: boolean;
  viewCount?: number;
}

export interface SubjectDetail {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lessons: LessonSummary[];
}

export interface LessonDetail {
  id: string;
  subjectId: string;
  subjectTitle: string;
  title: string;
  description: string;
  contentType: ContentType | number;
  contentUrl: string;
  sortOrder: number;
  isPublished: boolean;
  moduleTitle?: string | null;
  availableAt?: string | null;
  requiresPreviousCompletion?: boolean;
  attachmentUrl?: string | null;
  isCompleted?: boolean;
  viewCount?: number;
}

export interface CreateSubjectDto {
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
}

export interface UpdateSubjectDto {
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
}

export interface CreateLessonDto {
  title: string;
  description?: string;
  contentType: ContentType | number;
  contentUrl: string;
  isPublished: boolean;
  moduleTitle?: string | null;
  availableAt?: string | null;
  requiresPreviousCompletion?: boolean;
  attachmentUrl?: string | null;
}

export interface UpdateLessonDto {
  title: string;
  description?: string;
  contentType: ContentType | number;
  contentUrl: string;
  isPublished: boolean;
  moduleTitle?: string | null;
  availableAt?: string | null;
  requiresPreviousCompletion?: boolean;
  attachmentUrl?: string | null;
}

export interface ReorderLessonsDto {
  lessonIds: string[];
}

/**
 * Normalizes ContentType to string ('Video', 'Pdf', 'Word', 'Article', 'Link')
 */
export function normalizeContentType(type: ContentType | number | string): ContentType {
  if (type === 1 || type === '1' || type === 'Video') return 'Video';
  if (type === 2 || type === '2' || type === 'Pdf') return 'Pdf';
  if (type === 3 || type === '3' || type === 'Word') return 'Word';
  if (type === 4 || type === '4' || type === 'Article') return 'Article';
  if (type === 5 || type === '5' || type === 'Link') return 'Link';
  return 'Video';
}

/**
 * Converts ContentType to backend numeric enum:
 * Video: 1, Pdf: 2, Word: 3, Article: 4, Link: 5
 */
export function contentTypeToNumber(type: ContentType | number | string): number {
  if (typeof type === 'number') return type;
  switch (type) {
    case 'Video':
    case '1':
      return 1;
    case 'Pdf':
    case '2':
      return 2;
    case 'Word':
    case '3':
      return 3;
    case 'Article':
    case '4':
      return 4;
    case 'Link':
    case '5':
      return 5;
    default:
      return 1;
  }
}

/**
 * Arabic label for each content type
 */
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  Video: 'فيديو مرئي',
  Pdf: 'مستند PDF',
  Word: 'ملف Word',
  Article: 'مقال / نص',
  Link: 'رابط خارجي',
};
