import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { LandingSection } from '../types';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  TrendingUp,
  BookOpen,
  MessageSquareQuote,
  HelpCircle,
  Headphones,
  LayoutTemplate,
} from 'lucide-react';

interface SortableSectionItemProps {
  section: LandingSection;
  index: number;
  totalSections: number;
  onToggleEnabled: (id: string) => void;
  onChangeVariant: (id: string, variant: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onSelectForEdit?: (id: string) => void;
  isSelected?: boolean;
}

const SECTION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  hero: { label: 'البانر الترحيبي', icon: <Sparkles className="w-4 h-4 text-primary" /> },
  about: { label: 'عن المعلم والمنهج', icon: <UserCheck className="w-4 h-4 text-primary" /> },
  stats: { label: 'الأرقام والإحصائيات', icon: <TrendingUp className="w-4 h-4 text-primary" /> },
  subjects: { label: 'المواد والمناهج الدراسية', icon: <BookOpen className="w-4 h-4 text-primary" /> },
  testimonials: { label: 'آراء وتقييمات الطلاب', icon: <MessageSquareQuote className="w-4 h-4 text-primary" /> },
  faq: { label: 'الأسئلة الشائعة', icon: <HelpCircle className="w-4 h-4 text-primary" /> },
  contact: { label: 'معلومات التواصل', icon: <Headphones className="w-4 h-4 text-primary" /> },
  footer: { label: 'تذييل الصفحة', icon: <LayoutTemplate className="w-4 h-4 text-primary" /> },
};

const VARIANT_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
  hero: [
    { id: 'split', label: 'تقسيم جانبي' },
    { id: 'centered', label: 'توسيط' },
    { id: 'fullBackground', label: 'خلفية كاملة' },
  ],
  about: [
    { id: 'split', label: 'صورة ونص' },
    { id: 'card', label: 'بطاقة' },
    { id: 'compact', label: 'موجز' },
  ],
  stats: [
    { id: 'grid', label: 'شبكة أعمدة' },
    { id: 'inline', label: 'شريط أفقي' },
    { id: 'cards', label: 'بطاقات' },
  ],
  subjects: [
    { id: 'grid', label: 'شبكة كروت' },
    { id: 'carousel', label: 'تمرير أفقي' },
    { id: 'list', label: 'قائمة رأسية' },
  ],
  testimonials: [
    { id: 'grid', label: 'شبكة كروت' },
    { id: 'carousel', label: 'تمرير أفقي' },
    { id: 'quotes', label: 'اقتباسات' },
  ],
  faq: [
    { id: 'accordion', label: 'قائمة منسدلة' },
    { id: 'twoColumns', label: 'عمودين' },
    { id: 'cards', label: 'بطاقات' },
  ],
  contact: [
    { id: 'cards', label: 'بطاقات' },
    { id: 'split', label: 'تقسيم جانبي' },
    { id: 'compact', label: 'شريط موجز' },
  ],
  footer: [
    { id: 'columns', label: 'أعمدة تفصيلية' },
    { id: 'simple', label: 'بسيط موسط' },
    { id: 'minimal', label: 'مصغر' },
  ],
};

export const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
  section,
  index,
  totalSections,
  onToggleEnabled,
  onChangeVariant,
  onMoveUp,
  onMoveDown,
  onSelectForEdit,
  isSelected,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : section.enabled ? 1 : 0.65,
  };

  const meta = SECTION_LABELS[section.type] || {
    label: section.type,
    icon: <Sparkles className="w-4 h-4 text-primary" />,
  };
  const variants = VARIANT_OPTIONS[section.type] || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-surface border rounded-2xl transition-all ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
          : 'border-border hover:border-border-hover shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Drag handle & Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 text-text-muted hover:text-text-main cursor-grab active:cursor-grabbing rounded-lg hover:bg-bg transition-colors touch-none"
            title="سحب لإعادة الترتيب"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-main truncate">{meta.label}</span>
              {!section.enabled && (
                <span className="px-2 py-0.5 rounded-full bg-text-subtle/10 text-text-muted text-xs font-semibold">
                  مخفي
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted">النمط: {variants.find((v) => v.id === section.variant)?.label || section.variant}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Keyboard Reordering Buttons */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-bg">
            <button
              type="button"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="p-1 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text-main"
              title="تحريك لأعلى"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(index)}
              disabled={index === totalSections - 1}
              className="p-1 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text-main border-s border-border"
              title="تحريك لأسفل"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Enable/Disable Button */}
          <button
            type="button"
            onClick={() => onToggleEnabled(section.id)}
            className={`p-1.5 rounded-lg border transition-colors ${
              section.enabled
                ? 'bg-primary-subtle text-primary border-primary/20 hover:bg-primary-light/40'
                : 'bg-bg text-text-muted border-border hover:bg-surface-hover'
            }`}
            title={section.enabled ? 'إخفاء القسم من الصفحة' : 'إظهار القسم في الصفحة'}
          >
            {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Edit Content Button */}
          {onSelectForEdit && (
            <button
              type="button"
              onClick={() => onSelectForEdit(section.id)}
              className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary-subtle rounded-lg border border-primary/20 transition-colors"
            >
              تعديل المحتوى
            </button>
          )}
        </div>
      </div>

      {/* Variant Selector */}
      {variants.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2">
          <span className="text-xs text-text-muted shrink-0">اختر الشكل:</span>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onChangeVariant(section.id, v.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                  section.variant === v.id
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                    : 'bg-bg text-text-muted border-border hover:border-border-hover hover:text-text-main'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
