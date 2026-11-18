import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSubjectDetailQuery, useCreateSubjectMutation, useUpdateSubjectMutation } from '../useSubjects';
import { SubjectFormData } from '../schemas';
import { SubjectForm } from '../components/SubjectForm';
import { platformPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';

export const SubjectEditorPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const isEditing = !!subjectId;
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const { data: subject, isLoading: isFetching, error: fetchError, refetch } = useSubjectDetailQuery(subjectId);
  const createMutation = useCreateSubjectMutation();
  const updateMutation = useUpdateSubjectMutation(subjectId);

  const handleSubmit = async (data: SubjectFormData) => {
    try {
      if (isEditing && subjectId) {
        await updateMutation.mutateAsync({
          id: subjectId,
          dto: {
            title: data.title,
            description: data.description || '',
            thumbnailUrl: data.thumbnailUrl || null,
            isPublished: data.isPublished,
          },
        });
        success('تم تحديث بيانات المادة بنجاح');
        navigate(platformPath(`/dashboard/teacher/subjects/${subjectId}`));
      } else {
        const created = await createMutation.mutateAsync({
          title: data.title,
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || null,
          isPublished: data.isPublished,
        });
        success('تم إنشاء المادة بنجاح! يمكنك الآن إضافة الدروس والمجموعات.');
        navigate(platformPath(`/dashboard/teacher/subjects/${created.id}`));
      }
    } catch (err) {
      toastError(getApiErrorMessage(err, isEditing ? 'فشل تعديل المادة' : 'فشل إنشاء المادة'));
    }
  };

  const handleCancel = () => {
    if (isEditing && subjectId) {
      navigate(platformPath(`/dashboard/teacher/subjects/${subjectId}`));
    } else {
      navigate(platformPath('/dashboard/teacher/subjects'));
    }
  };

  if (isEditing && isFetching) {
    return (
      <PageLayout
        title="تعديل المادة الدراسية"
        isLoading={true}
        loadingMessage="جاري تحميل بيانات المادة..."
      >
        <div />
      </PageLayout>
    );
  }

  if (isEditing && fetchError) {
    return (
      <PageLayout
        title="خطأ في تحميل المادة"
        error={getApiErrorMessage(fetchError)}
        onRetry={refetch}
      >
        <div />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isEditing ? 'تعديل بيانات المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
      description="أدخل تفاصيل المادة، وغلافها، وحالة نشرها للطلاب"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'المواد الدراسية', href: platformPath('/dashboard/teacher/subjects') },
            { label: isEditing ? (subject?.title || 'تعديل المادة') : 'إضافة مادة جديدة' },
          ]}
        />
      }
      actions={
        <Link to={platformPath('/dashboard/teacher/subjects')}>
          <Button variant="ghost" size="sm">
            ← إلغاء وعودة للمواد
          </Button>
        </Link>
      }
    >
      <SubjectForm
        initialData={subject}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEditing={isEditing}
      />
    </PageLayout>
  );
};
