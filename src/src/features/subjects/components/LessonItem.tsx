import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { LessonSummary, CONTENT_TYPE_LABELS, normalizeContentType } from '../types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Video,
  FileText,
  Link as LinkIcon,
  File,
  Edit2,
  Trash2,
  FolderOpen,
  CalendarClock,
  Lock,
  Paperclip,
} from 'lucide-react';

interface LessonItemProps {
  lesson: LessonSummary;
  index: number;
  totalLessons: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (lesson: LessonSummary) => void;
  onDelete: (lesson: LessonSummary) => void;
  isReordering?: boolean;
}

export const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  index,
  totalLessons,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  isReordering = false,
}) => {
  const normType = normalizeContentType(lesson.contentType);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return <Video className="w-3.5 h-3.5" />;
      case 'Pdf':
      case 'Word':
      case 'Article':
        return <FileText className="w-3.5 h-3.5" />;
      case 'Link':
        return <LinkIcon className="w-3.5 h-3.5" />;
      default:
        return <File className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border rounded-xl gap-4 transition-all ${
        isDragging
          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
          : 'border-border hover:border-border-hover'
      }`}
    >
      {/* Left: Drag Handle + Reorder controls + Index + Title & Details */}
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded-md text-text-subtle hover:text-text-main hover:bg-surface-hover cursor-grab active:cursor-grabbing transition-colors shrink-0"
          title="اسحب لإعادة الترتيب"
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Up / Down Reorder buttons */}
        <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
          <button
            type="button"
            disabled={index === 0 || isReordering}
            onClick={() => onMoveUp(index)}
            className="p-1 rounded bg-surface-hover hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text-main transition-colors"
            title="تحريك لأعلى"
            aria-label="تحريك لأعلى"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalLessons - 1 || isReordering}
            onClick={() => onMoveDown(index)}
            className="p-1 rounded bg-surface-hover hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text-main transition-colors"
            title="تحريك لأسفل"
            aria-label="تحريك لأسفل"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Index Badge */}
        <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0 font-heading">
          {index + 1}
        </div>

        {/* Title, description, badges */}
        <div className="flex-1 min-w-0 text-start">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-bold text-sm sm:text-base text-text-main truncate max-w-md">
              {lesson.title}
            </h4>
            <Badge variant="neutral" size="sm" className="gap-1">
              {getTypeIcon(normType)}
              <span>{CONTENT_TYPE_LABELS[normType]}</span>
            </Badge>
            <Badge variant={lesson.isPublished ? 'success' : 'warning'} size="sm">
              {lesson.isPublished ? 'منشور' : 'مسودة'}
            </Badge>
            {lesson.price !== undefined && lesson.price > 0 && (
              <Badge variant="info" size="sm">
                {lesson.price} ج.م
              </Badge>
            )}
            {lesson.moduleTitle && (
              <Badge variant="primary" size="sm" className="gap-1">
                <FolderOpen className="w-3 h-3" />
                <span>{lesson.moduleTitle}</span>
              </Badge>
            )}
            {lesson.requiresPreviousCompletion && (
              <Badge variant="neutral" size="sm" className="gap-1">
                <Lock className="w-3 h-3" />
                <span>مشروط بالسابقة</span>
              </Badge>
            )}
            {lesson.availableAt && new Date(lesson.availableAt).getTime() > Date.now() && (
              <Badge variant="warning" size="sm" className="gap-1">
                <CalendarClock className="w-3 h-3" />
                <span>مجدول</span>
              </Badge>
            )}
            {lesson.attachmentUrl && (
              <Badge variant="neutral" size="sm" className="gap-1">
                <Paperclip className="w-3 h-3" />
                <span>ملزمة PDF</span>
              </Badge>
            )}
          </div>
          {lesson.description && (
            <p className="text-xs text-text-muted line-clamp-1">
              {lesson.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(lesson)}
          startIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          تعديل
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-bg hover:text-danger"
          onClick={() => onDelete(lesson)}
          startIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          حذف
        </Button>
      </div>
    </div>
  );
};
