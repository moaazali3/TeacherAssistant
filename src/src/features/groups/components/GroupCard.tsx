import React, { useState } from 'react';
import { GroupDto } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Copy,
  Check,
  RotateCcw,
  Users,
  Edit2,
  Trash2,
} from 'lucide-react';

interface GroupCardProps {
  group: GroupDto;
  onViewStudents: (group: GroupDto) => void;
  onEdit: (group: GroupDto) => void;
  onDelete: (group: GroupDto) => void;
  onRegenerateCode: (group: GroupDto) => void;
  onToggleCode: (group: GroupDto) => void;
  isActionLoading?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onViewStudents,
  onEdit,
  onDelete,
  onRegenerateCode,
  onToggleCode,
  isActionLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = group.joinCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="flex flex-col border border-border shadow-xs hover:border-primary/40 transition-colors text-start">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={group.isOpen ? 'success' : 'neutral'} size="sm">
                {group.isOpen ? 'مفتوحة للانضمام' : 'مغلقة'}
              </Badge>
              <Badge variant={group.isCodeActive ? 'primary' : 'warning'} size="sm">
                {group.isCodeActive ? 'الكود مفعّل' : 'الكود معطّل'}
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold">{group.name}</CardTitle>
          </div>

          <div className="text-end shrink-0">
            <span className="text-xs text-text-muted block font-medium">عدد الطلاب</span>
            <span className="text-lg font-black font-heading text-text-main">
              {group.studentsCount}
            </span>
          </div>
        </div>

        {group.scheduleText && (
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5 bg-surface-subtle px-2.5 py-1.5 rounded-lg border border-border-subtle">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{group.scheduleText}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="py-3 flex-1">
        {/* Join Code Box */}
        <div className="bg-surface-subtle border border-border rounded-xl p-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-medium text-text-muted block">كود انضمام الطلاب</span>
            <span
              className={`text-base font-black font-mono tracking-widest ${
                group.isCodeActive ? 'text-primary' : 'text-text-muted line-through'
              }`}
            >
              {group.joinCode}
            </span>
          </div>

          <Button
            type="button"
            variant={copied ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleCopyCode}
            className="shrink-0 font-bold text-xs"
            title="نسخ كود الانضمام"
            aria-label="نسخ كود الانضمام"
          >
            {copied ? (
              <span className="flex items-center gap-1.5 text-success">
                <Check className="w-3.5 h-3.5" />
                تم النسخ!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                نسخ الكود
              </span>
            )}
          </Button>
        </div>

        {/* Code management actions */}
        <div className="flex items-center gap-2 mt-3 text-xs">
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => onRegenerateCode(group)}
            className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>توليد كود جديد</span>
          </button>
          <span className="text-border">•</span>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => onToggleCode(group)}
            className="text-text-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            {group.isCodeActive ? 'تعطيل الكود' : 'تفعيل الكود'}
          </button>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onViewStudents(group)}
          startIcon={<Users className="w-4 h-4" />}
          className="font-bold flex-1"
        >
          الطلاب ({group.studentsCount})
        </Button>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(group)}
            title="تعديل بيانات المجموعة"
            aria-label="تعديل بيانات المجموعة"
            className="px-2"
          >
            <Edit2 className="w-4 h-4 text-text-muted hover:text-primary" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(group)}
            title="حذف المجموعة"
            aria-label="حذف المجموعة"
            className="px-2 hover:bg-danger-bg hover:text-danger text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
