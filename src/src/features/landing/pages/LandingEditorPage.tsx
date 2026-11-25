import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { landingApi } from '../api';
import { LandingPageConfig, LandingTheme, FontFamily, BorderRadius, ButtonStyle } from '../types';
import { landingThemeSchema } from '../schemas';
import { LANDING_TEMPLATES, LandingTemplate, applyLandingTemplate } from '../templates';
import { LandingRenderer } from '../LandingRenderer';
import { SortableSectionItem } from '../components/SortableSectionItem';
import { SectionContentEditor } from '../components/SectionContentEditor';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/api';
import { platformPath } from '@/lib/tenant';
import { useTenant } from '@/features/tenant/useTenant';
import {
  Palette,
  Layers,
  FileText,
  Save,
  RotateCcw,
  Smartphone,
  Laptop,
  AlertTriangle,
  LayoutTemplate,
  Check,
} from 'lucide-react';

const FONTS: Array<{ id: FontFamily; label: string }> = [
  { id: 'Cairo', label: 'خط كايرو (Cairo)' },
  { id: 'Tajawal', label: 'خط تجوال (Tajawal)' },
  { id: 'Almarai', label: 'خط المراعي (Almarai)' },
  { id: 'IBM Plex Sans Arabic', label: 'خط آي بي إم (IBM Plex)' },
];

const RADII: Array<{ id: BorderRadius; label: string }> = [
  { id: 'none', label: 'حواف حادة' },
  { id: 'md', label: 'دائرية خفيفة' },
  { id: 'xl', label: 'دائرية عصرية' },
  { id: 'full', label: 'دائرية كاملة' },
];

const BUTTON_STYLES: Array<{ id: ButtonStyle; label: string }> = [
  { id: 'solid', label: 'ممتلئ (Solid)' },
  { id: 'outline', label: 'مفرغ (Outline)' },
  { id: 'soft', label: 'ناعم ملون (Soft)' },
];

export const LandingEditorPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Active form tab: 'templates' | 'sections' | 'content' | 'theme'
  const [activeTab, setActiveTab] = useState<'templates' | 'sections' | 'content' | 'theme'>('templates');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  // Preview mode: 'desktop' | 'mobile'
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  // Selected section for content editing
  const [selectedSectionId, setSelectedSectionId] = useState<string>('hero');
  // Reset confirmation dialog
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Local draft state for live preview
  const [draftConfig, setDraftConfig] = useState<LandingPageConfig | null>(null);
  const [originalConfigJson, setOriginalConfigJson] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch current landing config
  const { data: serverConfig, isLoading, isError, error } = useQuery({
    queryKey: ['landing-editor-config'],
    queryFn: () => landingApi.getLandingConfig(),
    staleTime: 1000 * 60 * 5,
  });

  // Sync draft state on initial load
  useEffect(() => {
    if (serverConfig && !draftConfig) {
      setDraftConfig(serverConfig);
      setOriginalConfigJson(JSON.stringify(serverConfig));
      if (serverConfig.sections?.length > 0) {
        setSelectedSectionId(serverConfig.sections[0].id);
      }
    }
  }, [serverConfig, draftConfig]);

  // Is draft modified?
  const isDirty = useMemo(() => {
    if (!draftConfig || !originalConfigJson) return false;
    return JSON.stringify(draftConfig) !== originalConfigJson;
  }, [draftConfig, originalConfigJson]);

  // Warn on browser tab close if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle Drag & Drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !draftConfig) return;

    setDraftConfig((prev) => {
      if (!prev) return prev;
      const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
      const newIndex = prev.sections.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      return {
        ...prev,
        sections: arrayMove(prev.sections, oldIndex, newIndex),
      };
    });
  };

  // Keyboard reordering handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0 || !draftConfig) return;
    setDraftConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: arrayMove(prev.sections, index, index - 1),
      };
    });
  };

  const handleMoveDown = (index: number) => {
    if (!draftConfig || index >= draftConfig.sections.length - 1) return;
    setDraftConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: arrayMove(prev.sections, index, index + 1),
      };
    });
  };

  // Toggle enabled/disabled
  const handleToggleEnabled = (id: string) => {
    setDraftConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      };
    });
  };

  // Change section variant
  const handleChangeVariant = (id: string, variant: string) => {
    setDraftConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? { ...s, variant } : s)),
      };
    });
  };

  // Update theme field
  const handleThemeChange = (key: keyof LandingTheme, value: any) => {
    setDraftConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        theme: {
          ...prev.theme,
          [key]: value,
        },
      };
    });
  };

  // Update section content
  const handleContentChange = (id: string, updatedContent: Record<string, unknown>) => {
    setDraftConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === id ? { ...s, content: updatedContent } : s
        ),
      };
    });
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (config: LandingPageConfig) => landingApi.updateLandingConfig(config),
    onSuccess: (updated) => {
      setDraftConfig(updated);
      setOriginalConfigJson(JSON.stringify(updated));
      setValidationErrors([]);
      queryClient.invalidateQueries({ queryKey: ['landing-editor-config'] });
      queryClient.invalidateQueries({ queryKey: ['landing-config'] });
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('تم حفظ إعدادات الصفحة الرئيسية بنجاح! التغييرات تظهر لطلابك الآن.');
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'فشل حفظ إعدادات الصفحة الرئيسية');
      toast.error(msg);
    },
  });

  // Reset Mutation
  const resetMutation = useMutation({
    mutationFn: () => landingApi.resetLandingConfig(),
    onSuccess: (defaultConfig) => {
      setDraftConfig(defaultConfig);
      setOriginalConfigJson(JSON.stringify(defaultConfig));
      setValidationErrors([]);
      queryClient.invalidateQueries({ queryKey: ['landing-editor-config'] });
      queryClient.invalidateQueries({ queryKey: ['landing-config'] });
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      setIsResetConfirmOpen(false);
      toast.success('تمت استعادة القالب الافتراضي بنجاح');
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'فشل استعادة القالب الافتراضي');
      toast.error(msg);
    },
  });

  const handleSave = () => {
    if (!draftConfig) return;

    // Validate theme with zod
    const themeValidation = landingThemeSchema.safeParse(draftConfig.theme);
    if (!themeValidation.success) {
      const errors = themeValidation.error.errors.map((e) => e.message);
      setValidationErrors(errors);
      toast.error('يرجى تصحيح أخطاء الألوان والخطوط قبل الحفظ');
      setActiveTab('theme');
      return;
    }

    setValidationErrors([]);
    saveMutation.mutate(draftConfig);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-sm font-semibold text-text-muted">جاري تحميل محرر الصفحة الرئيسية...</p>
      </div>
    );
  }

  if (isError || !draftConfig) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-danger-bg text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-main">فشل فتح محرر الصفحة الرئيسية</h2>
        <p className="text-sm text-text-muted">{getApiErrorMessage(error)}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const selectedSection = draftConfig.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col" dir="rtl">
      {/* Top Bar with Breadcrumbs & Save Actions */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-3.5 sticky top-16 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <Breadcrumbs
            items={[
              { label: 'لوحة تحكم المعلم', href: platformPath('/dashboard/teacher') },
              { label: 'تخصيص الصفحة الرئيسية' },
            ]}
          />
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black font-heading text-text-main">
              تخصيص الصفحة الرئيسية لطلابك
            </h1>
            {isDirty && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold animate-pulse">
                تعديلات غير محفوظة
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            startIcon={<RotateCcw className="w-3.5 h-3.5" />}
            disabled={saveMutation.isPending || resetMutation.isPending}
          >
            استعادة الافتراضي
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            startIcon={<Save className="w-4 h-4" />}
            className="font-bold"
          >
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Main Two-Pane Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Editor Controls & Tabs (Cols 5) */}
        <div className="lg:col-span-5 border-e border-border bg-surface flex flex-col h-full lg:max-h-[calc(100vh-135px)] overflow-y-auto">
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-border bg-surface sticky top-0 z-10 px-3 pt-2 overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`shrink-0 px-2.5 pb-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'templates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>القوالب الجاهزة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`shrink-0 px-2.5 pb-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'sections'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>الأقسام</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`shrink-0 px-2.5 pb-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>النصوص والصور</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`shrink-0 px-2.5 pb-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'theme'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>الألوان</span>
            </button>
          </div>

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="m-4 p-4 rounded-xl bg-danger-bg text-danger border border-danger/30 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>أخطاء التحقق:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 ps-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 0: READY LANDING PAGE TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="p-4 sm:p-6 space-y-4 text-start">
              <div>
                <h3 className="text-sm font-bold text-text-main">اختر تصميم صفحتك الرئيسية</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  اختر من 4 قوالب مختلفة في الشكل وترتيب الأقسام والألوان مع الحفاظ التلقائي على نصوصك وصورك.
                </p>
              </div>

              <div className="space-y-3">
                {LANDING_TEMPLATES.map((tpl: LandingTemplate) => {
                  const isApplied = activeTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                        isApplied
                          ? 'border-primary bg-primary-subtle/50 shadow-xs'
                          : 'border-border bg-bg hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-text-main font-heading">
                              {tpl.name}
                            </h4>
                            <Badge variant={isApplied ? 'primary' : 'neutral'} size="sm">
                              {tpl.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {tpl.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: tpl.theme.primaryColor }}
                            title="اللون الرئيسي"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: tpl.theme.secondaryColor }}
                            title="اللون الثانوي"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: tpl.theme.backgroundColor }}
                            title="خلفية الصفحة"
                          />
                          <span className="text-[11px] text-text-subtle ms-1">
                            {tpl.theme.fontFamily}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant={isApplied ? 'outline' : 'primary'}
                          size="sm"
                          className="font-bold text-xs"
                          startIcon={isApplied ? <Check className="w-3.5 h-3.5" /> : undefined}
                          onClick={() => {
                            setDraftConfig((prev) =>
                              prev ? applyLandingTemplate(prev, tpl) : prev
                            );
                            setActiveTemplateId(tpl.id);
                            toast.success(`تم تطبيق قالب «${tpl.name}» في المعاينة. اضغط حفظ لاعتماده.`);
                          }}
                        >
                          {isApplied ? 'مطبّق في المعاينة' : 'تطبيق القالب'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: SECTIONS & REORDERING */}
          {activeTab === 'sections' && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-main">أقسام الصفحة وترتيبها</h3>
                  <p className="text-xs text-text-muted">
                    اسحب الأقسام لإعادة الترتيب أو اضغط أزرار الأسهم، ويمكنك إخفاء أي قسم.
                  </p>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={draftConfig.sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {draftConfig.sections.map((sec, idx) => (
                      <SortableSectionItem
                        key={sec.id}
                        section={sec}
                        index={idx}
                        totalSections={draftConfig.sections.length}
                        onToggleEnabled={handleToggleEnabled}
                        onChangeVariant={handleChangeVariant}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onSelectForEdit={(id) => {
                          setSelectedSectionId(id);
                          setActiveTab('content');
                        }}
                        isSelected={selectedSectionId === sec.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* TAB 2: CONTENT EDITOR */}
          {activeTab === 'content' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">
                  اختر القسم المطلوب تعديل نصوصه وصوره:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-primary shadow-2xs"
                >
                  {draftConfig.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.type} - {sec.enabled ? 'مفعّل' : 'مخفي'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSection ? (
                <div className="p-5 bg-bg rounded-2xl border border-border space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm font-bold text-primary font-heading">
                      تعديل محتوى: {selectedSection.type}
                    </span>
                    <span className="text-xs text-text-muted">
                      الشكل النشط: {selectedSection.variant}
                    </span>
                  </div>
                  <SectionContentEditor
                    section={selectedSection}
                    onChangeContent={handleContentChange}
                  />
                </div>
              ) : (
                <p className="text-center text-sm text-text-muted py-8">
                  يرجى تحديد قسم للبدء في تعديل محتواه.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: THEME & BRANDING */}
          {activeTab === 'theme' && (
            <div className="p-4 sm:p-6 space-y-6 text-start">
              <div>
                <h3 className="text-sm font-bold text-text-main">ألوان الصفحة والهوية</h3>
                <p className="text-xs text-text-muted">
                  هذه الألوان تطبق فورياً على أزرار وخلفيات ونصوص صفحتك لجميع الزوار.
                </p>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1">
                    اللون الرئيسي (Primary)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftConfig.theme.primaryColor || '#0F766E'}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                    />
                    <input
                      type="text"
                      value={draftConfig.theme.primaryColor || ''}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono uppercase rounded-xl border border-border bg-surface text-text-main"
                      placeholder="#0F766E"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1">
                    اللون الثانوي (Secondary)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftConfig.theme.secondaryColor || '#0D9488'}
                      onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                    />
                    <input
                      type="text"
                      value={draftConfig.theme.secondaryColor || ''}
                      onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono uppercase rounded-xl border border-border bg-surface text-text-main"
                      placeholder="#0D9488"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1">
                    لون خلفية الصفحة (Background)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftConfig.theme.backgroundColor || '#FFFFFF'}
                      onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                    />
                    <input
                      type="text"
                      value={draftConfig.theme.backgroundColor || ''}
                      onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono uppercase rounded-xl border border-border bg-surface text-text-main"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1">
                    لون النصوص الأساسية (Text)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftConfig.theme.textColor || '#0F172A'}
                      onChange={(e) => handleThemeChange('textColor', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                    />
                    <input
                      type="text"
                      value={draftConfig.theme.textColor || ''}
                      onChange={(e) => handleThemeChange('textColor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono uppercase rounded-xl border border-border bg-surface text-text-main"
                      placeholder="#0F172A"
                    />
                  </div>
                </div>
              </div>

              {/* Font Family Picker */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="block text-xs font-bold text-text-main">نوع الخط العربي (Typography)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => handleThemeChange('fontFamily', font.id)}
                      className={`p-3 text-start rounded-xl border text-sm font-semibold transition-all ${
                        draftConfig.theme.fontFamily === font.id
                          ? 'border-primary bg-primary-subtle text-primary ring-2 ring-primary/20'
                          : 'border-border bg-bg text-text-main hover:bg-surface'
                      }`}
                      style={{ fontFamily: `"${font.id}", sans-serif` }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius Picker */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="block text-xs font-bold text-text-main">نمط انحناء الحواف (Border Radius)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RADII.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleThemeChange('borderRadius', r.id)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        draftConfig.theme.borderRadius === r.id
                          ? 'border-primary bg-primary-subtle text-primary ring-1 ring-primary/20'
                          : 'border-border bg-bg text-text-muted hover:text-text-main'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Style Picker */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="block text-xs font-bold text-text-main">نمط الأزرار (Button Style)</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUTTON_STYLES.map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleThemeChange('buttonStyle', btn.id)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        draftConfig.theme.buttonStyle === btn.id
                          ? 'border-primary bg-primary-subtle text-primary ring-1 ring-primary/20'
                          : 'border-border bg-bg text-text-muted hover:text-text-main'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Image URL / Upload */}
              <div className="pt-2 border-t border-border-subtle">
                <ImageUploadField
                  label="صورة الهيرو / الغلاف الرئيسي"
                  folder="landing"
                  value={draftConfig.theme.heroImageUrl || ''}
                  onChange={(val) => handleThemeChange('heroImageUrl', val)}
                  placeholder="https://... أو ارفع صورة من جهازك"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: LIVE PREVIEW (Cols 7) */}
        <div className="lg:col-span-7 bg-bg/70 flex flex-col h-full lg:max-h-[calc(100vh-135px)] overflow-hidden">
          {/* Preview Viewport Toolbar */}
          <div className="px-6 py-2.5 bg-surface border-b border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-muted">معاينة حية ومباشرة:</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary-subtle text-primary font-bold">
                Live Draft
              </span>
            </div>

            {/* Viewport Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-bg border border-border">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'desktop'
                    ? 'bg-surface text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="عرض شاشة الكمبيوتر"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>حاسوب</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'mobile'
                    ? 'bg-surface text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="عرض شاشة الهاتف المحمول"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>هاتف (390px)</span>
              </button>
            </div>
          </div>

          {/* Preview Stage */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
            {previewMode === 'mobile' ? (
              <div className="w-[390px] border-[10px] border-text-main rounded-[44px] shadow-2xl bg-surface overflow-hidden transition-all duration-300">
                {/* Mobile Notch Bar */}
                <div className="h-6 bg-text-main flex items-center justify-center">
                  <div className="w-20 h-3.5 bg-black/40 rounded-full" />
                </div>
                {/* Mobile Screen Content */}
                <div className="max-h-[720px] overflow-y-auto">
                  <LandingRenderer
                    config={draftConfig}
                    tenantName={tenant?.name || 'أكاديمية المعلم'}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full bg-surface border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                <LandingRenderer
                  config={draftConfig}
                  tenantName={tenant?.name || 'أكاديمية المعلم'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => resetMutation.mutate()}
        title="استعادة القالب الافتراضي للصفحة الرئيسية"
        description="هل أنت متأكد من رغبتك في استعادة الإعدادات الافتراضية؟ سيتم إلغاء كافة التخصيصات الحالية واستبدالها بنموذج الصفحة الأصلي."
        confirmText="نعم، استعادة الافتراضي"
        cancelText="إلغاء"
        variant="danger"
        isLoading={resetMutation.isPending}
      />
    </div>
  );
};
