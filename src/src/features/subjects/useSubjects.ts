import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from './api';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateLessonDto,
  UpdateLessonDto,
} from './types';
import { useTenantSlug } from '@/lib/tenant';

export function useMySubjectsQuery() {
  const slug = useTenantSlug();
  return useQuery({
    queryKey: ['subjects', 'mine', slug],
    queryFn: () => subjectsApi.getMySubjects(),
    enabled: !!slug,
  });
}

export function usePublishedSubjectsQuery() {
  const slug = useTenantSlug();
  return useQuery({
    queryKey: ['subjects', 'published', slug],
    queryFn: () => subjectsApi.getPublishedSubjects(),
    enabled: !!slug,
  });
}

export function useSubjectDetailQuery(subjectId: string | undefined) {
  const slug = useTenantSlug();
  return useQuery({
    queryKey: ['subjects', 'detail', subjectId, slug],
    queryFn: () => {
      if (!subjectId) throw new Error('معرف المادة غير صالح');
      return subjectsApi.getSubjectDetail(subjectId);
    },
    enabled: !!subjectId && !!slug,
  });
}

export function useLessonDetailQuery(lessonId: string | undefined) {
  const slug = useTenantSlug();
  return useQuery({
    queryKey: ['lessons', 'detail', lessonId, slug],
    queryFn: () => {
      if (!lessonId) throw new Error('معرف الدرس غير صالح');
      return subjectsApi.getLessonDetail(lessonId);
    },
    enabled: !!lessonId && !!slug,
  });
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: (dto: CreateSubjectDto) => subjectsApi.createSubject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'mine', slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'published', slug] });
    },
  });
}

export function useUpdateSubjectMutation(subjectId?: string) {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubjectDto }) =>
      subjectsApi.updateSubject(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'mine', slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'published', slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'detail', variables.id, slug] });
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: ['subjects', 'detail', subjectId, slug] });
      }
    },
  });
}

export function useDeleteSubjectMutation() {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: (id: string) => subjectsApi.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'mine', slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'published', slug] });
    },
  });
}

export function useAddLessonMutation(subjectId: string) {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: (dto: CreateLessonDto) => subjectsApi.addLesson(subjectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'detail', subjectId, slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'mine', slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'published', slug] });
    },
  });
}

export function useUpdateLessonMutation(subjectId: string) {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: ({ lessonId, dto }: { lessonId: string; dto: UpdateLessonDto }) =>
      subjectsApi.updateLesson(lessonId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'detail', subjectId, slug] });
      queryClient.invalidateQueries({ queryKey: ['lessons', 'detail', variables.lessonId, slug] });
    },
  });
}

export function useDeleteLessonMutation(subjectId: string) {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: (lessonId: string) => subjectsApi.deleteLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'detail', subjectId, slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'mine', slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'published', slug] });
    },
  });
}

export function useReorderLessonsMutation(subjectId: string) {
  const queryClient = useQueryClient();
  const slug = useTenantSlug();

  return useMutation({
    mutationFn: (lessonIds: string[]) => subjectsApi.reorderLessons(subjectId, lessonIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'detail', subjectId, slug] });
    },
  });
}
