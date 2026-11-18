import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupsApi } from '../api';
import { GroupDto, CreateGroupDto, UpdateGroupDto } from '../types';
import { subjectsApi } from '@/features/subjects/api';
import { SubjectDetail } from '@/features/subjects/types';
import { GroupCard } from '../components/GroupCard';
import { GroupFormModal } from '../components/GroupFormModal';
import { GroupStudentsModal } from '../components/GroupStudentsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';
import { platformPath } from '@/lib/tenant';
import { Users, Plus, BookOpen } from 'lucide-react';

export const SubjectGroupsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { success, error: toastError } = useToast();

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupDto | null>(null);
  const [selectedGroupForStudents, setSelectedGroupForStudents] = useState<GroupDto | null>(null);

  // Confirm dialogs
  const [groupToDelete, setGroupToDelete] = useState<GroupDto | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [groupToRegenerateCode, setGroupToRegenerateCode] = useState<GroupDto | null>(null);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

  const loadData = useCallback(async () => {
    if (!subjectId) return;
    try {
      setIsLoading(true);
      setLoadError(null);
      const [subjectData, groupsData] = await Promise.all([
        subjectsApi.getById(subjectId),
        groupsApi.getSubjectGroups(subjectId),
      ]);
      setSubject(subjectData);
      setGroups(groupsData);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'فشل تحميل بيانات المجموعات والمادة'));
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdateGroup = async (dto: CreateGroupDto | UpdateGroupDto) => {
    if (!subjectId) return;
    if (editingGroup) {
      const updated = await groupsApi.updateGroup(editingGroup.id, dto);
      success('تم تحديث بيانات المجموعة بنجاح.');
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } else {
      const created = await groupsApi.createGroup(subjectId, dto);
      success(`تم إنشاء المجموعة بنجاح! كود الانضمام: ${created.joinCode}`);
      setGroups((prev) => [created, ...prev]);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      setIsDeletingGroup(true);
      setActionLoadingId(groupToDelete.id);
      await groupsApi.deleteGroup(groupToDelete.id);
      success('تم حذف المجموعة بنجاح.');
      setGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      setGroupToDelete(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حذف المجموعة'));
    } finally {
      setIsDeletingGroup(false);
      setActionLoadingId(null);
    }
  };

  const handleConfirmRegenerateCode = async () => {
    if (!groupToRegenerateCode) return;
    try {
      setIsRegeneratingCode(true);
      setActionLoadingId(groupToRegenerateCode.id);
      const updated = await groupsApi.regenerateCode(groupToRegenerateCode.id);
      success(`تم توليد كود جديد للمجموعة: ${updated.joinCode}`);
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setGroupToRegenerateCode(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل إعادة توليد الكود'));
    } finally {
      setIsRegeneratingCode(false);
      setActionLoadingId(null);
    }
  };

  const handleToggleCode = async (group: GroupDto) => {
    try {
      setActionLoadingId(group.id);
      const updated = await groupsApi.toggleCode(group.id);
      success(updated.isCodeActive ? 'تم تفعيل كود الانضمام.' : 'تم تعطيل كود الانضمام.');
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل تغيير حالة الكود'));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 w-1/3 bg-surface-hover rounded-lg animate-pulse" />
        <div className="h-28 bg-surface-hover rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="تعذر تحميل بيانات المجموعات"
          description={loadError}
          action={
            <Button variant="primary" onClick={loadData}>
              إعادة المحاولة
            </Button>
          }
        />
      </div>
    );
  }

  const totalStudents = groups.reduce((acc, g) => acc + g.studentsCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
          { label: 'المواد الدراسية', href: platformPath('/dashboard/teacher/subjects') },
          { label: subject?.title || 'المادة', href: platformPath(`/dashboard/teacher/subjects/${subjectId}`) },
          { label: 'المجموعات والطلاب' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-surface border border-border rounded-2xl p-6 shadow-xs text-start">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-text-main">
              إدارة مجموعات: {subject?.title}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-light text-primary">
              {groups.length} مجموعات • {totalStudents} طالب
            </span>
          </div>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            أنشئ مجموعات لطلابك وشارك معهم كود الانضمام ليتمكنوا من التسجيل ومتابعة دروس المادة.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to={platformPath(`/dashboard/teacher/subjects/${subjectId}`)}>
            <Button variant="outline" size="md" startIcon={<BookOpen className="w-4 h-4" />}>
              إدارة الدروس
            </Button>
          </Link>

          <Button
            variant="primary"
            size="md"
            className="font-bold"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingGroup(null);
              setIsFormModalOpen(true);
            }}
          >
            إنشاء مجموعة جديدة
          </Button>
        </div>
      </div>

      {/* Groups Grid or Empty State */}
      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-primary" />}
          title="لا توجد مجموعات بعد لهذه المادة"
          description="قم بإنشاء المجموعة الأولى الآن ليتم توليد كود انضمام فوري يمكنك مشاركته مع طلابك ليتمكنوا من التسجيل."
          action={
            <Button
              variant="primary"
              size="lg"
              className="font-bold"
              startIcon={<Plus className="w-5 h-5" />}
              onClick={() => {
                setEditingGroup(null);
                setIsFormModalOpen(true);
              }}
            >
              إنشاء أول مجموعة
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isActionLoading={actionLoadingId === group.id}
              onViewStudents={(g) => setSelectedGroupForStudents(g)}
              onEdit={(g) => {
                setEditingGroup(g);
                setIsFormModalOpen(true);
              }}
              onDelete={(g) => setGroupToDelete(g)}
              onRegenerateCode={(g) => setGroupToRegenerateCode(g)}
              onToggleCode={handleToggleCode}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Group Modal */}
      <GroupFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingGroup(null);
        }}
        initialData={editingGroup}
        subjectTitle={subject?.title}
        onSubmit={handleCreateOrUpdateGroup}
      />

      {/* Students List & Management Modal */}
      <GroupStudentsModal
        isOpen={!!selectedGroupForStudents}
        onClose={() => setSelectedGroupForStudents(null)}
        group={selectedGroupForStudents}
        allGroups={groups}
        onStudentsCountChanged={loadData}
      />

      {/* Delete Group Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleConfirmDeleteGroup}
        title="تأكيد حذف المجموعة"
        description={
          groupToDelete ? (
            <span>
              هل أنت متأكد من حذف مجموعة <strong className="text-text-main">«{groupToDelete.name}»</strong>؟
              سيتم إلغاء تسجيل جميع الطلاب المرتبطين بها في هذه المجموعة.
            </span>
          ) : ''
        }
        confirmText="نعم، احذف المجموعة"
        isLoading={isDeletingGroup}
      />

      {/* Regenerate Code Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!groupToRegenerateCode}
        onClose={() => setGroupToRegenerateCode(null)}
        onConfirm={handleConfirmRegenerateCode}
        title="إعادة توليد كود الانضمام"
        variant="warning"
        description={
          groupToRegenerateCode ? (
            <span>
              هل أنت متأكد من إعادة توليد كود جديد لمجموعة <strong className="text-text-main">«{groupToRegenerateCode.name}»</strong>؟
              لن يتمكن الطلاب من استخدام الكود القديم (<code className="font-mono text-primary font-bold">{groupToRegenerateCode.joinCode}</code>) بعد الآن.
            </span>
          ) : ''
        }
        confirmText="توليد كود جديد"
        isLoading={isRegeneratingCode}
      />
    </div>
  );
};
