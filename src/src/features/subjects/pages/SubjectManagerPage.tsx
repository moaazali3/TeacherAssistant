import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  useSubjectDetailQuery,
  useUpdateSubjectMutation,
  useAddLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderLessonsMutation,
} from '../useSubjects';
import { LessonSummary, LessonDetail } from '../types';
import { LessonFormData } from '../schemas';
import { subjectsApi } from '../api';
import { platformPath, buildTenantFullUrl, useTenantSlug, tenantPath } from '@/lib/tenant';
import { useAuth } from '@/features/auth/useAuth';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LessonItem } from '../components/LessonItem';
import { LessonModal } from '../components/LessonModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';
import {
  BookOpen,
  Plus,
  Users,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  ClipboardList,
} from 'lucide-react';

export const SubjectManagerPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const currentSlug = useTenantSlug() || user?.tenantSubdomain;
  const { data: subject, isLoading, error, refetch } = useSubjectDetailQuery(subjectId);

  const updateSubjectMutation = useUpdateSubjectMutation(subjectId);
  const addLessonMutation = useAddLessonMutation(subjectId || '');
  const updateLessonMutation = useUpdateLessonMutation(subjectId || '');
  const deleteLessonMutation = useDeleteLessonMutation(subjectId || '');
  const reorderMutation = useReorderLessonsMutation(subjectId || '');

  const { success, error: toastError } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonDetail | null>(null);
  const [isLoadingLessonDetail, setIsLoadingLessonDetail] = useState(false);

  // Delete Lesson State
  const [lessonToDelete, setLessonToDelete] = useState<LessonSummary | null>(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Toggle publish
  const handleToggleSubjectPublish = async () => {
    if (!subject) return;
    try {
      await updateSubjectMutation.mutateAsync({
        id: subject.id,
        dto: {
          title: subject.title,
          description: subject.description,
          thumbnailUrl: subject.thumbnailUrl,
          isPublished: !subject.isPublished,
        },
      });
      success(subject.isPublished ? 'تم تحويل المادة إلى مسودة' : 'تم نشر المادة لجميع الطلاب!');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل تحديث حالة المادة'));
    }
  };

  // Reorder lessons via Drag and Drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !subject?.lessons) return;

    const oldIndex = subject.lessons.findIndex((l) => l.id === active.id);
    const newIndex = subject.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newLessons = arrayMove(subject.lessons, oldIndex, newIndex);
    const newIds = newLessons.map((l) => l.id);

    try {
      await reorderMutation.mutateAsync(newIds);
      success('تم تحديث ترتيب الدروس بنجاح');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حفظ ترتيب الدروس'));
    }
  };

  // Reorder lessons Up / Down (keyboard fallback)
  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    if (!subject || !subject.lessons) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subject.lessons.length) return;

    const reordered = [...subject.lessons];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const orderedIds = reordered.map((l) => l.id);

    try {
      await reorderMutation.mutateAsync(orderedIds);
      success('تم تحديث ترتيب الدروس بنجاح');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل إعادة ترتيب الدروس'));
    }
  };

  // Open modal for editing (fetches full lesson with contentUrl)
  const handleOpenEditModal = async (summary: LessonSummary) => {
    try {
      setIsLoadingLessonDetail(true);
      const fullLesson = await subjectsApi.getLessonDetail(summary.id);
      setEditingLesson(fullLesson);
      setIsModalOpen(true);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل جلب تفاصيل الدرس'));
    } finally {
      setIsLoadingLessonDetail(false);
    }
  };

  // Handle Add/Edit Lesson submit
  const handleModalSubmit = async (data: LessonFormData) => {
    if (!subjectId) return;

    try {
      const sharedPayload = {
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        contentUrl: data.contentUrl,
        isPublished: data.isPublished,
        moduleTitle: data.moduleTitle?.trim() || null,
        availableAt: data.availableAt ? new Date(data.availableAt).toISOString() : null,
        requiresPreviousCompletion: data.requiresPreviousCompletion,
        attachmentUrl: data.attachmentUrl?.trim() || null,
      };

      if (editingLesson) {
        await updateLessonMutation.mutateAsync({
          lessonId: editingLesson.id,
          dto: sharedPayload,
        });
        success('تم تعديل الدرس بنجاح!');
      } else {
        await addLessonMutation.mutateAsync(sharedPayload);
        success('تمت إضافة الدرس الجديد بنجاح!');
      }

      setIsModalOpen(false);
      setEditingLesson(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حفظ بيانات الدرس'));
    }
  };

  // Confirm delete lesson
  const handleConfirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      await deleteLessonMutation.mutateAsync(lessonToDelete.id);
      success('تم حذف الدرس بنجاح');
      setLessonToDelete(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حذف الدرس'));
    }
  };

  const studentSubjectUrl = currentSlug
    ? buildTenantFullUrl(currentSlug, `/subjects/${subjectId}`)
    : tenantPath(`/subjects/${subjectId}`);

  return (
    <PageLayout
      title={subject?.title || 'إدارة المادة'}
      description="إدارة تفاصيل المادة، المجموعات، وترتيب الدروس والمحاضرات."
      isLoading={isLoading}
      skeleton={
        <div className="space-y-4">
          <div className="h-44 bg-surface-hover rounded-2xl animate-pulse" />
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      }
      error={error ? getApiErrorMessage(error) : null}
      onRetry={refetch}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'المواد الدراسية', href: platformPath('/dashboard/teacher/subjects') },
            { label: subject?.title || 'إدارة المادة' },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {studentSubjectUrl && (
            <a href={studentSubjectUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                startIcon={<ExternalLink className="w-4 h-4" />}
              >
                معاينة كطالب ↗
              </Button>
            </a>
          )}

          <Link to={platformPath(`/dashboard/teacher/subjects/${subjectId}/groups`)}>
            <Button
              variant="outline"
              size="sm"
              startIcon={<Users className="w-4 h-4" />}
            >
              المجموعات والطلاب
            </Button>
          </Link>

          <Link to={platformPath(`/dashboard/teacher/subjects/${subjectId}/quizzes`)}>
            <Button
              variant="outline"
              size="sm"
              startIcon={<ClipboardList className="w-4 h-4" />}
            >
              الواجبات والامتحانات
            </Button>
          </Link>

          <Link to={platformPath(`/dashboard/teacher/subjects/${subjectId}/edit`)}>
            <Button
              variant="secondary"
              size="sm"
              startIcon={<Edit2 className="w-4 h-4" />}
            >
              تعديل المادة
            </Button>
          </Link>

          {subject && (
            <Button
              variant={subject.isPublished ? 'outline' : 'primary'}
              size="sm"
              isLoading={updateSubjectMutation.isPending}
              onClick={handleToggleSubjectPublish}
              startIcon={subject.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            >
              {subject.isPublished ? 'إلغاء النشر' : 'نشر للطلاب'}
            </Button>
          )}
        </div>
      }
    >
      {subject && (
        <div className="space-y-8 text-start">
          {/* Subject Overview Card */}
          <Card className="overflow-hidden border-border">
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {subject.thumbnailUrl ? (
                <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden bg-surface-subtle shrink-0 border border-border">
                  <img
                    src={subject.thumbnailUrl}
                    alt={subject.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full md:w-56 h-36 rounded-xl bg-surface-subtle border border-border shrink-0 flex items-center justify-center text-primary">
                  <BookOpen className="w-12 h-12 stroke-[1.5]" />
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={subject.isPublished ? 'success' : 'warning'}>
                    {subject.isPublished ? 'منشورة للطلاب' : 'مسودة'}
                  </Badge>
                  <Badge variant="neutral">
                    {subject.lessons.length} دروس ومحاضرات
                  </Badge>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-main">
                  {subject.title}
                </h2>

                <p className="text-sm text-text-muted leading-relaxed">
                  {subject.description || 'لا يوجد وصف مضاف لهذه المادة حتى الآن.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Lessons Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-xl font-bold font-heading text-text-main flex items-center gap-2">
                <span>الدروس والمحتوى التعليمي</span>
                <span className="text-xs font-medium text-text-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-border">
                  {subject.lessons.length}
                </span>
              </h3>
              <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5 text-text-subtle" />
                <span>يمكنك سحب أي درس بالماوس أو استخدام أزرار الأسهم لإعادة ترتيبه.</span>
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingLesson(null);
                setIsModalOpen(true);
              }}
              startIcon={<Plus className="w-4 h-4" />}
              className="font-bold shrink-0"
            >
              إضافة درس جديد
            </Button>
          </div>

          {/* Lessons List with DND Kit */}
          {subject.lessons.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-10 h-10 text-primary" />}
              title="لم تقم بإضافة أي درس لهذا المادة بعد"
              description="أضف محاضرات الفيديو من يوتيوب، مذكرات الشرح من جوجل درايف، أو ملفات الـ PDF لبدء مسار التعلم."
              action={
                <Button
                  variant="primary"
                  startIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingLesson(null);
                    setIsModalOpen(true);
                  }}
                >
                  إضافة أول درس الآن
                </Button>
              }
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subject.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {subject.lessons.map((lesson, idx) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={idx}
                      totalLessons={subject.lessons.length}
                      onMoveUp={(i) => handleMoveLesson(i, 'up')}
                      onMoveDown={(i) => handleMoveLesson(i, 'down')}
                      onEdit={handleOpenEditModal}
                      onDelete={(l) => setLessonToDelete(l)}
                      isReordering={reorderMutation.isPending}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Add / Edit Lesson Modal */}
      <LessonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLesson(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingLesson}
        isLoading={addLessonMutation.isPending || updateLessonMutation.isPending || isLoadingLessonDetail}
      />

      {/* Delete Lesson Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!lessonToDelete}
        onClose={() => setLessonToDelete(null)}
        onConfirm={handleConfirmDeleteLesson}
        title="تأكيد حذف الدرس"
        description={
          lessonToDelete ? (
            <span>
              هل أنت متأكد من حذف درس <strong className="text-text-main">«{lessonToDelete.title}»</strong>؟
              لن يتمكن الطلاب من مشاهدته بعد الحذف.
            </span>
          ) : ''
        }
        confirmText="نعم، احذف الدرس"
        isLoading={deleteLessonMutation.isPending}
      />
    </PageLayout>
  );
};
