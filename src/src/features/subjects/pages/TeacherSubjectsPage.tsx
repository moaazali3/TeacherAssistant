import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMySubjectsQuery, useUpdateSubjectMutation, useDeleteSubjectMutation } from '../useSubjects';
import { SubjectSummary } from '../types';
import { platformPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { SubjectCard } from '../components/SubjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';
import { Plus, ArrowRight, Search, BookOpen } from 'lucide-react';

export const TeacherSubjectsPage: React.FC = () => {
  const { data: subjects = [], isLoading, error, refetch } = useMySubjectsQuery();
  const updateMutation = useUpdateSubjectMutation();
  const deleteMutation = useDeleteSubjectMutation();
  const { success, error: toastError } = useToast();

  const [subjectToDelete, setSubjectToDelete] = useState<SubjectSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch =
        subject.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && subject.isPublished) ||
        (statusFilter === 'draft' && !subject.isPublished);

      return matchesSearch && matchesStatus;
    });
  }, [subjects, searchQuery, statusFilter]);

  const handleTogglePublish = async (subject: SubjectSummary) => {
    try {
      await updateMutation.mutateAsync({
        id: subject.id,
        dto: {
          title: subject.title,
          description: subject.description,
          thumbnailUrl: subject.thumbnailUrl,
          isPublished: !subject.isPublished,
        },
      });
      success(subject.isPublished ? 'تم تحويل المادة إلى مسودة' : 'تم نشر المادة بنجاح!');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل تغيير حالة المادة'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteMutation.mutateAsync(subjectToDelete.id);
      success('تم حذف المادة بنجاح');
      setSubjectToDelete(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حذف المادة'));
    }
  };

  return (
    <PageLayout
      title="المواد الدراسية"
      description="إدارة كافة المواد والمقررات الدراسية، والدروس، والمجموعات للطلاب."
      isLoading={isLoading}
      skeleton={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      }
      error={error ? getApiErrorMessage(error) : null}
      onRetry={refetch}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'المواد الدراسية' },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link to={platformPath('/dashboard/teacher/subjects/new')}>
            <Button variant="primary" size="sm" className="font-bold" startIcon={<Plus className="w-4 h-4" />}>
              إضافة مادة جديدة
            </Button>
          </Link>
          <Link to={platformPath('/dashboard/teacher')}>
            <Button variant="secondary" size="sm" startIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
              لوحة التحكم
            </Button>
          </Link>
        </div>
      }
    >
      {/* Search and Filters Bar */}
      {subjects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-surface p-3.5 rounded-2xl border border-border">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث باسم المادة أو الوصف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-xl border border-border bg-surface text-text-main placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Search className="w-4 h-4 text-text-muted absolute start-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-muted hover:bg-surface-hover'
              }`}
            >
              الكل ({subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'published'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-muted hover:bg-surface-hover'
              }`}
            >
              منشورة ({subjects.filter((s) => s.isPublished).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-muted hover:bg-surface-hover'
              }`}
            >
              مسودة ({subjects.filter((s) => !s.isPublished).length})
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-primary" />}
          title="لا توجد أي مواد دراسية بعد"
          description="ابدأ بإضافة أول مادة دراسية، ثم أنشئ مجموعات لطلابك وأضف الدروس وشروحات الفيديو بسهولة."
          action={
            <Link to={platformPath('/dashboard/teacher/subjects/new')}>
              <Button variant="primary" startIcon={<Plus className="w-4 h-4" />}>
                إضافة أول مادة الآن
              </Button>
            </Link>
          }
        />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={<Search className="w-10 h-10 text-text-muted" />}
          title="لا توجد نتائج مطابقة لبحثك"
          description="جرب البحث بكلمات أخرى أو تغيير فلتر الحالة."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              إعادة تعيين البحث
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              isTeacherView
              onTogglePublish={handleTogglePublish}
              onDelete={(c) => setSubjectToDelete(c)}
              isPublishing={updateMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد حذف المادة"
        description={
          subjectToDelete ? (
            <span>
              هل أنت متأكد من رغبتك في حذف مادة <strong className="text-text-main">«{subjectToDelete.title}»</strong>؟
              سيتم حذف جميع الدروس والمجموعات التابعة لها بشكل نهائي.
            </span>
          ) : ''
        }
        confirmText="نعم، احذف المادة"
        isLoading={deleteMutation.isPending}
      />
    </PageLayout>
  );
};
