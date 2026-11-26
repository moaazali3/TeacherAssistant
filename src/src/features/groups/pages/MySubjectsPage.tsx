import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { groupsApi } from '../api';
import { MyGroupDto } from '../types';
import { subjectsApi } from '@/features/subjects/api';
import { SubjectSummary } from '@/features/subjects/types';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { getApiErrorMessage } from '@/lib/api';
import { tenantPath } from '@/lib/tenant';
import { useAuth } from '@/features/auth/useAuth';
import { useTenant } from '@/features/tenant/useTenant';
import { formatDateArabic } from '@/lib/date';
import { BookOpen, Plus, Clock, ArrowLeft, Sparkles, KeyRound, PlayCircle } from 'lucide-react';

export const MySubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const [groups, setGroups] = useState<MyGroupDto[]>([]);
  const [sameGradeSubjects, setSameGradeSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchMyGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [groupsData, availableData] = await Promise.all([
        groupsApi.getMyGroups(),
        subjectsApi.getSameGradeAvailableSubjects().catch(() => [] as SubjectSummary[]),
      ]);
      setGroups(groupsData);
      setSameGradeSubjects(availableData);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'فشل تحميل المواد المسجل بها'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  const studentPrimaryGrade = groups.find((g) => g.subjectGradeLevel)?.subjectGradeLevel;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-start space-y-10">
      {/* Welcome & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-6 shadow-xs">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">
            بوابة الطالب • منصة {tenant?.name || 'التعليمية'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-text-main">
            موادي الدراسية
          </h1>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            مرحباً بك يا <span className="font-bold text-text-main">{user?.name}</span>! تصفح دروس ومواد مجموعاتك الدراسية.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="font-bold shrink-0"
          startIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsJoinModalOpen(true)}
        >
          الانضمام لمجموعة أخرى بكود
        </Button>
      </div>

      {/* Enrolled Subjects Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : loadError ? (
        <EmptyState
          title="تعذر تحميل موادك الدراسية"
          description={loadError}
          action={
            <Button variant="primary" size="lg" className="font-bold" onClick={fetchMyGroups}>
              إعادة المحاولة
            </Button>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12 text-primary" />}
          title="لست منضماً لأي مادة حالياً"
          description="قم بإدخال كود الانضمام المكوّن من 8 خانات المقدم من المعلم للوصول إلى دروس وشروحات المادة فوراً."
          action={
            <Button
              variant="primary"
              size="lg"
              className="font-bold"
              startIcon={<Plus className="w-5 h-5" />}
              onClick={() => setIsJoinModalOpen(true)}
            >
              الانضمام لمجموعة الآن
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((item) => (
            <Card
              key={item.groupId}
              className="flex flex-col border border-border hover:border-primary/50 transition-all shadow-xs hover:shadow-md text-start"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="primary" size="sm">
                    {item.subjectGradeLevel || 'مادة دراسية'}
                  </Badge>
                  <span className="text-xs text-text-muted">
                    انضممت: {formatDateArabic(item.joinedAt, 'd MMMM')}
                  </span>
                </div>

                <CardTitle className="text-xl font-bold leading-tight line-clamp-1">
                  {item.subjectTitle}
                </CardTitle>
              </CardHeader>

              <CardContent className="py-2 flex-1 space-y-3">
                <div className="bg-surface-subtle border border-border/80 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">المجموعة:</span>
                    <span className="font-bold text-text-main">{item.groupName}</span>
                  </div>

                  {item.instructorName && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">المعلم:</span>
                      <span className="font-medium text-text-main">{item.instructorName}</span>
                    </div>
                  )}

                  {item.scheduleText && (
                    <div className="pt-1.5 border-t border-border-subtle flex items-start gap-1.5 text-primary">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{item.scheduleText}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border-subtle">
                <Link to={tenantPath(`/subjects/${item.subjectId}`)} className="w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-bold justify-between"
                    endIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-0" />}
                  >
                    <span>فتح المادة ومتابعة الدروس</span>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Companion Courses Available for the Same Grade Level */}
      {!isLoading && !loadError && sameGradeSubjects.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold font-heading text-text-main">
                  كورسات وفروع أخرى متاحة لصفك
                </h2>
                {studentPrimaryGrade && (
                  <Badge variant="info" size="sm">
                    {studentPrimaryGrade}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                كورسات ومراجعات إضافية لنفس صفك الدراسي — يمكنك الانضمام لأي منها عند الحصول على كود المجموعة من المعلم.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sameGradeSubjects.map((sub) => (
              <Card key={sub.id} className="flex flex-col border-border bg-surface text-start">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {sub.gradeLevel && (
                      <Badge variant="neutral" size="sm">
                        {sub.gradeLevel}
                      </Badge>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
                      <PlayCircle className="w-3.5 h-3.5 text-primary" />
                      <span>{sub.lessonsCount} {sub.lessonsCount === 1 ? 'درس' : 'دروس'}</span>
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold line-clamp-1">
                    {sub.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 flex-1">
                  <p className="text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed">
                    {sub.description || 'كورس متكامل مخصص لطلاب نفس الصف الدراسي.'}
                  </p>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border-subtle">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-bold"
                    startIcon={<KeyRound className="w-3.5 h-3.5" />}
                    onClick={() => setIsJoinModalOpen(true)}
                  >
                    انضمام بكود المجموعة
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={() => fetchMyGroups()}
      />
    </div>
  );
};
