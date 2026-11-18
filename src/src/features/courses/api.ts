import { subjectsApi } from '@/features/subjects/api';

/**
 * Backwards compatibility alias for coursesApi -> subjectsApi
 */
export const coursesApi = {
  getMyCourses: () => subjectsApi.getMySubjects(),
  getPublishedCourses: () => subjectsApi.getPublishedSubjects(),
  getCourseDetail: (id: string) => subjectsApi.getSubjectDetail(id),
  getById: (id: string) => subjectsApi.getById(id),
  createCourse: (dto: Parameters<typeof subjectsApi.createSubject>[0]) => subjectsApi.createSubject(dto),
  updateCourse: (id: string, dto: Parameters<typeof subjectsApi.updateSubject>[1]) => subjectsApi.updateSubject(id, dto),
  deleteCourse: (id: string) => subjectsApi.deleteSubject(id),
  addLesson: (courseId: string, dto: Parameters<typeof subjectsApi.addLesson>[1]) => subjectsApi.addLesson(courseId, dto),
  updateLesson: (lessonId: string, dto: Parameters<typeof subjectsApi.updateLesson>[1]) => subjectsApi.updateLesson(lessonId, dto),
  deleteLesson: (lessonId: string) => subjectsApi.deleteLesson(lessonId),
  reorderLessons: (courseId: string, lessonIds: string[]) => subjectsApi.reorderLessons(courseId, lessonIds),
  getLessonDetail: (lessonId: string) => subjectsApi.getLessonDetail(lessonId),
};
