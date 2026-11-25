import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { platformPath } from '@/lib/tenant';
import { getApiErrorMessage } from '@/lib/api';
import { studentsApi } from '../api';
import { StudentSummaryDto, buildParentWhatsAppUrl } from '../types';
import { StudentProgressModal } from '../components/StudentProgressModal';
import {
  Users,
  Search,
  Phone,
  PhoneCall,
  MessageCircle,
  Eye,
  Award,
  CheckCircle2,
} from 'lucide-react';

export const StudentsTrackingPage: React.FC = () => {
  const [students, setStudents] = useState<StudentSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await studentsApi.getStudents();
      setStudents(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'فشل تحميل قائمة الطلاب'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phoneNumber && s.phoneNumber.includes(q)) ||
      (s.parentPhoneNumber && s.parentPhoneNumber.includes(q)) ||
      s.groups.some((g) => g.toLowerCase().includes(q))
    );
  });

  const activeQuizStudents = students.filter((s) => s.completedQuizzesCount > 0).length;
  const studentsWithAvg = students.filter(
    (s) => s.averageScorePercentage !== null && s.averageScorePercentage !== undefined
  );
  const overallAvg =
    studentsWithAvg.length > 0
      ? Math.round(
          studentsWithAvg.reduce((acc, s) => acc + (s.averageScorePercentage || 0), 0) /
            studentsWithAvg.length
        )
      : null;

  return (
    <PageLayout
      title="متابعة الطلاب"
      description="تقرير شامل لكل طالب: المجموعة، درجات الامتحانات، حالة الواجبات، والتواصل المباشر مع ولي الأمر."
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'الطلاب والمتابعة' },
          ]}
        />
      }
      isLoading={isLoading}
      skeleton={
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      }
      error={error}
      onRetry={fetchStudents}
    >
      <div className="space-y-6 text-start">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">إجمالي الطلاب المسجلين</p>
                <p className="text-2xl font-black text-text-main font-heading mt-1">
                  {students.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">طلاب لديهم تسليمات</p>
                <p className="text-2xl font-black text-text-main font-heading mt-1">
                  {activeQuizStudents}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">متوسط الدرجات العام</p>
                <p className="text-2xl font-black text-text-main font-heading mt-1">
                  {overallAvg !== null ? `${overallAvg}%` : '—'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب أو البريد أو رقم الهاتف أو ولي الأمر أو اسم المجموعة..."
            className="w-full ps-10 pe-4 py-3 text-sm rounded-xl border border-border bg-surface text-text-main placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Search className="w-4 h-4 text-text-muted absolute start-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Directory */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10 text-text-muted" />}
            title={searchQuery ? 'لا توجد نتائج مطابقة' : 'لا يوجد طلاب مسجلون بعد'}
            description={
              searchQuery
                ? 'جرب البحث بكلمة مختلفة.'
                : 'بمجرد تسجيل الطلاب في مجموعاتك سيظهرون هنا مع تقارير أدائهم.'
            }
          />
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-surface-subtle text-text-muted text-xs border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-start">الطالب</th>
                    <th className="py-3 px-4 font-semibold text-start">المجموعات</th>
                    <th className="py-3 px-4 font-semibold text-start">أرقام التواصل</th>
                    <th className="py-3 px-4 font-semibold text-start">الامتحانات والواجبات</th>
                    <th className="py-3 px-4 font-semibold text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((student) => {
                    const waUrl = buildParentWhatsAppUrl(
                      student.parentPhoneNumber,
                      `السلام عليكم ولي أمر الطالب/ة ${student.name}،\nمتابعة من المنصة التعليمية: أتم الطالب ${student.completedQuizzesCount} من ${student.totalQuizzesCount} اختبار/واجب.`
                    );
                    return (
                      <tr
                        key={student.studentId}
                        className="hover:bg-surface-hover/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-text-main">{student.name}</p>
                              <p className="text-xs font-mono text-text-muted">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {student.groups.length > 0 ? (
                              student.groups.map((g) => (
                                <Badge key={g} variant="neutral" size="sm">
                                  {g}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-text-subtle">—</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-primary shrink-0" />
                              <span dir="ltr" className="font-mono text-text-main">
                                {student.phoneNumber || '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <PhoneCall className="w-3 h-3 text-text-subtle shrink-0" />
                              <span dir="ltr" className="font-mono text-text-muted">
                                {student.parentPhoneNumber || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-text-main">
                              {student.completedQuizzesCount} / {student.totalQuizzesCount} مكتمل
                            </span>
                            {student.averageScorePercentage !== null &&
                            student.averageScorePercentage !== undefined ? (
                              <Badge variant="success" size="sm" className="w-fit">
                                متوسط {student.averageScorePercentage}%
                              </Badge>
                            ) : (
                              <span className="text-text-subtle">لا توجد درجات بعد</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudentId(student.studentId)}
                              startIcon={<Eye className="w-3.5 h-3.5" />}
                              className="text-xs font-bold"
                            >
                              ملف الطالب
                            </Button>

                            {waUrl && (
                              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-emerald-700 hover:bg-emerald-50"
                                  startIcon={<MessageCircle className="w-3.5 h-3.5" />}
                                  title="مراسلة ولي الأمر عبر واتساب"
                                >
                                  واتساب
                                </Button>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <StudentProgressModal
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        studentId={selectedStudentId}
      />
    </PageLayout>
  );
};
