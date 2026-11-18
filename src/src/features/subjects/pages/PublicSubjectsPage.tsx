import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublishedSubjectsQuery } from '../useSubjects';
import { tenantPath } from '@/lib/tenant';
import { PageLayout } from '@/components/ui/PageLayout';
import { SubjectCard } from '../components/SubjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export const PublicSubjectsPage: React.FC = () => {
  const { data: subjects = [], isLoading, error, refetch } = usePublishedSubjectsQuery();
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculation
  const totalSubjects = subjects.length;
  const totalPages = Math.ceil(totalSubjects / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSubjects = subjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <PageLayout
      title="المقررات والمواد التعليمية"
      description="استكشف الدروس والمناهج المتاحة وانضم لتجربة تعلم استثنائية."
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
            { label: 'الرئيسية', href: tenantPath('/') },
            { label: 'المواد' },
          ]}
        />
      }
      actions={
        <Link to={tenantPath('/')}>
          <Button variant="secondary" size="sm" startIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
            رئيسية المنصة
          </Button>
        </Link>
      }
    >
      {totalSubjects === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-text-muted" />}
          title="لا توجد مواد منشورة حالياً"
          description="لم يقم المعلم بنشر أي مادة بعد. يمكنك العودة لاحقاً لمتابعة أحدث المحتويات التعليمية."
        />
      ) : (
        <div className="space-y-8">
          {/* Subjects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSubjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} isTeacherView={false} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-subtle">
              <p className="text-xs sm:text-sm text-text-muted">
                عرض {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, totalSubjects)} من إجمالي {totalSubjects} مادة
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={handlePrevPage}
                  startIcon={<ArrowRight className="w-4 h-4 rtl:rotate-0" />}
                >
                  السابق
                </Button>

                <span className="text-xs font-bold px-3 py-1.5 bg-surface-subtle border border-border rounded-lg text-text-main">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={handleNextPage}
                  endIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-0" />}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
};
