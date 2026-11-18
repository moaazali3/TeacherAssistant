import React from 'react';
import { Link } from 'react-router-dom';
import { SubjectSummary } from '../types';
import { tenantPath, platformPath } from '@/lib/tenant';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  Users,
  PlayCircle,
  ImageOff,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SubjectCardProps {
  subject: SubjectSummary;
  isTeacherView?: boolean;
  onTogglePublish?: (subject: SubjectSummary) => void;
  onDelete?: (subject: SubjectSummary) => void;
  isPublishing?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  isTeacherView = false,
  onTogglePublish,
  onDelete,
  isPublishing = false,
}) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-md border-border hover:border-primary/40 text-start">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-surface-subtle overflow-hidden border-b border-border">
        {subject.thumbnailUrl ? (
          <img
            src={subject.thumbnailUrl}
            alt={subject.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-subtle p-4 text-center">
            <ImageOff className="w-10 h-10 mb-1.5 stroke-[1.5]" />
            <span className="text-xs">لا توجد صورة مصغرة</span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 z-10">
          {isTeacherView ? (
            <Badge variant={subject.isPublished ? 'success' : 'warning'} size="sm">
              {subject.isPublished ? 'منشورة للطلاب' : 'مسودة'}
            </Badge>
          ) : (
            <Badge variant="primary" size="sm">
              مادة دراسية
            </Badge>
          )}
        </div>

        <div className="absolute bottom-2.5 end-2.5 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-surface/90 text-text-main backdrop-blur-xs border border-border shadow-xs">
            <PlayCircle className="w-3.5 h-3.5 text-primary" />
            <span>
              {subject.lessonsCount} {subject.lessonsCount === 1 ? 'درس' : 'دروس'}
            </span>
          </span>
        </div>
      </div>

      {/* Body */}
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base sm:text-lg line-clamp-1 hover:text-primary transition-colors">
          {isTeacherView ? (
            <Link to={platformPath(`/dashboard/teacher/subjects/${subject.id}`)}>
              {subject.title}
            </Link>
          ) : (
            <Link to={tenantPath(`/subjects/${subject.id}`)}>
              {subject.title}
            </Link>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
        <p className="text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed">
          {subject.description || 'لا يوجد وصف مضاف لهذه المادة حتى الآن.'}
        </p>
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="p-4 pt-3 border-t border-border-subtle bg-surface-subtle/50">
        {isTeacherView ? (
          <div className="flex flex-col gap-2.5 w-full">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Link to={platformPath(`/dashboard/teacher/subjects/${subject.id}`)}>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-bold"
                  startIcon={<BookOpen className="w-3.5 h-3.5" />}
                >
                  إدارة الدروس ({subject.lessonsCount})
                </Button>
              </Link>

              <Link to={platformPath(`/dashboard/teacher/subjects/${subject.id}/groups`)}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs font-bold"
                  startIcon={<Users className="w-3.5 h-3.5" />}
                >
                  المجموعات
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-2">
                <Link
                  to={platformPath(`/dashboard/teacher/subjects/${subject.id}/edit`)}
                  className="text-text-muted hover:text-primary font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>تعديل</span>
                </Link>
                <span className="text-border">•</span>
                {onTogglePublish && (
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => onTogglePublish(subject)}
                    className="text-text-muted hover:text-primary font-medium transition-colors flex items-center gap-1"
                  >
                    {subject.isPublished ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>تحويل لمسودة</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>نشر المادة</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(subject)}
                  className="text-danger hover:underline font-medium flex items-center gap-1"
                  title="حذف المادة"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <Link to={tenantPath(`/subjects/${subject.id}`)} className="w-full">
            <Button
              variant="primary"
              size="sm"
              className="w-full font-bold"
              startIcon={<BookOpen className="w-4 h-4" />}
            >
              استعراض محتوى المادة
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};
