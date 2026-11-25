import React from 'react';
import { LandingSection } from '../types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { Plus, Trash2 } from 'lucide-react';

interface SectionContentEditorProps {
  section: LandingSection;
  onChangeContent: (id: string, updatedContent: Record<string, unknown>) => void;
}

export const SectionContentEditor: React.FC<SectionContentEditorProps> = ({
  section,
  onChangeContent,
}) => {
  const content = (section.content || {}) as Record<string, any>;

  const updateField = (key: string, value: any) => {
    onChangeContent(section.id, {
      ...content,
      [key]: value,
    });
  };

  // 1. HERO CONTENT EDITOR
  if (section.type === 'hero') {
    return (
      <div className="space-y-4 text-start">
        <Input
          label="العنوان الرئيسي"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: مرحباً بكم في منصة التفوق"
        />
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text-main">النص التعريفي الفرعي</label>
          <textarea
            rows={3}
            value={content.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder="وصف مختصر لمميزات المنصة والمنهج..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="نص الزر الأساسي"
            value={content.primaryButtonText || ''}
            onChange={(e) => updateField('primaryButtonText', e.target.value)}
            placeholder="مثال: ابدأ الآن"
          />
          <Input
            label="رابط الزر الأساسي"
            value={content.primaryButtonLink || ''}
            onChange={(e) => updateField('primaryButtonLink', e.target.value)}
            placeholder="/register أو رابط كامل"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="نص الزر الثانوي"
            value={content.secondaryButtonText || ''}
            onChange={(e) => updateField('secondaryButtonText', e.target.value)}
            placeholder="مثال: استكشف المواد"
          />
          <Input
            label="رابط الزر الثانوي"
            value={content.secondaryButtonLink || ''}
            onChange={(e) => updateField('secondaryButtonLink', e.target.value)}
            placeholder="/subjects"
          />
        </div>
        <ImageUploadField
          label="صورة الهيرو"
          folder="landing"
          value={content.imageUrl || ''}
          onChange={(val) => updateField('imageUrl', val)}
          placeholder="https://example.com/image.jpg أو ارفع صورة"
        />
      </div>
    );
  }

  // 2. ABOUT CONTENT EDITOR
  if (section.type === 'about') {
    const features = Array.isArray(content.features) ? content.features : [];

    const handleFeatureChange = (index: number, val: string) => {
      const next = [...features];
      next[index] = val;
      updateField('features', next);
    };

    const addFeature = () => {
      updateField('features', [...features, 'ميزة جديدة']);
    };

    const removeFeature = (index: number) => {
      updateField(
        'features',
        features.filter((_, i) => i !== index)
      );
    };

    return (
      <div className="space-y-4 text-start">
        <Input
          label="عنوان القسم"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: عن المعلم والمنهج"
        />
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text-main">السيرة الذاتية وفلسفة التدريس</label>
          <textarea
            rows={4}
            value={content.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder="اكتب نبذة عن مسيرتك الأكاديمية والمهنية..."
          />
        </div>
        <ImageUploadField
          label="صورة القسم التعريفي"
          folder="landing"
          previewAspect="square"
          value={content.imageUrl || ''}
          onChange={(val) => updateField('imageUrl', val)}
          placeholder="https://example.com/teacher.jpg أو ارفع صورة"
        />
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-main">النقاط والمميزات البارزة</label>
            <Button type="button" variant="outline" size="sm" onClick={addFeature} startIcon={<Plus className="w-3.5 h-3.5" />}>
              إضافة ميزة
            </Button>
          </div>
          <div className="space-y-2">
            {features.map((feat: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-primary"
                  placeholder="نص الميزة..."
                />
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="p-2 text-danger hover:bg-danger-bg rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. STATS CONTENT EDITOR
  if (section.type === 'stats') {
    const items = Array.isArray(content.items) ? content.items : [];

    const updateItem = (index: number, key: string, val: string) => {
      const next = [...items];
      next[index] = { ...next[index], [key]: val };
      updateField('items', next);
    };

    const addItem = () => {
      updateField('items', [...items, { label: 'إحصائية جديدة', value: '+100', icon: 'users' }]);
    };

    const removeItem = (index: number) => {
      updateField(
        'items',
        items.filter((_, i) => i !== index)
      );
    };

    return (
      <div className="space-y-4 text-start">
        <Input
          label="عنوان القسم (اختياري)"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: أرقام نفتخر بها"
        />
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-main">قائمة الأرقام والإحصائيات</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem} startIcon={<Plus className="w-3.5 h-3.5" />}>
              إضافة رقم
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((stat: any, idx: number) => (
              <div key={idx} className="p-3 bg-bg border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">الرقم #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-danger hover:bg-danger-bg rounded-md"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="القيمة (الرقم)"
                    value={stat.value || ''}
                    onChange={(e) => updateItem(idx, 'value', e.target.value)}
                    placeholder="+1,500"
                  />
                  <Input
                    label="التسمية"
                    value={stat.label || ''}
                    onChange={(e) => updateItem(idx, 'label', e.target.value)}
                    placeholder="طالب متفوق"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الأيقونة</label>
                  <select
                    value={stat.icon || 'users'}
                    onChange={(e) => updateItem(idx, 'icon', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-main"
                  >
                    <option value="users">مستخدمين (users)</option>
                    <option value="award">كأس / جائزة (award)</option>
                    <option value="trending-up">نمو ونجاح (trending-up)</option>
                    <option value="clock">ساعة (clock)</option>
                    <option value="book">كتاب (book)</option>
                    <option value="star">نجمة (star)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. SUBJECTS CONTENT EDITOR
  if (section.type === 'subjects') {
    return (
      <div className="space-y-4 text-start">
        <Input
          label="عنوان القسم"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: المواد الدراسية المتاحة"
        />
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text-main">النص التعريفي الفرعي</label>
          <textarea
            rows={2}
            value={content.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-primary resize-none"
            placeholder="استكشف المواد والمناهج..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1">
            عدد المواد المعروضة في الصفحة الرئيسية
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={content.showCount || 6}
            onChange={(e) => updateField('showCount', parseInt(e.target.value) || 6)}
            className="w-32 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-primary"
          />
        </div>
        <p className="text-xs text-text-muted bg-primary-subtle/50 p-3 rounded-xl border border-primary/20">
          💡 يتم جلب المواد المنشورة الحقيقية تلقائياً من قائمة موادك الدراسية النشطة.
        </p>
      </div>
    );
  }

  // 5. TESTIMONIALS CONTENT EDITOR
  if (section.type === 'testimonials') {
    const items = Array.isArray(content.items) ? content.items : [];

    const updateItem = (index: number, key: string, val: any) => {
      const next = [...items];
      next[index] = { ...next[index], [key]: val };
      updateField('items', next);
    };

    const addItem = () => {
      updateField('items', [
        ...items,
        {
          id: Date.now().toString(),
          name: 'اسم الطالب',
          role: 'طالب ثانوي',
          text: 'رأي الطالب وتجربته مع المنهج...',
          rating: 5,
        },
      ]);
    };

    const removeItem = (index: number) => {
      updateField(
        'items',
        items.filter((_, i) => i !== index)
      );
    };

    return (
      <div className="space-y-4 text-start">
        <Input
          label="عنوان القسم"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: آراء وتجارب طلابنا"
        />
        <Input
          label="النص الفرعي"
          value={content.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          placeholder="قصص نجاح نفتخر بها"
        />
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-main">قائمة التقييمات والآراء</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem} startIcon={<Plus className="w-3.5 h-3.5" />}>
              إضافة رأي
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((t: any, idx: number) => (
              <div key={idx} className="p-3 bg-bg border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">التقييم #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-danger hover:bg-danger-bg rounded-md"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="اسم الطالب"
                    value={t.name || ''}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  />
                  <Input
                    label="الصف أو الوصف"
                    value={t.role || ''}
                    onChange={(e) => updateItem(idx, 'role', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-text-muted">نص الرأي أو التجربة</label>
                  <textarea
                    rows={2}
                    value={t.text || ''}
                    onChange={(e) => updateItem(idx, 'text', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-main resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">التقييم بالنجوم (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={t.rating || 5}
                      onChange={(e) => updateItem(idx, 'rating', parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface"
                    />
                  </div>
                  <Input
                    label="رابط صورة الأفاتار (اختياري)"
                    value={t.avatarUrl || ''}
                    onChange={(e) => updateItem(idx, 'avatarUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 6. FAQ CONTENT EDITOR
  if (section.type === 'faq') {
    const items = Array.isArray(content.items) ? content.items : [];

    const updateItem = (index: number, key: string, val: string) => {
      const next = [...items];
      next[index] = { ...next[index], [key]: val };
      updateField('items', next);
    };

    const addItem = () => {
      updateField('items', [
        ...items,
        { id: Date.now().toString(), question: 'سؤال جديد؟', answer: 'إجابة السؤال هنا...' },
      ]);
    };

    const removeItem = (index: number) => {
      updateField(
        'items',
        items.filter((_, i) => i !== index)
      );
    };

    return (
      <div className="space-y-4 text-start">
        <Input
          label="عنوان القسم"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: الأسئلة الأكثر شيوعاً"
        />
        <Input
          label="النص الفرعي"
          value={content.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          placeholder="إجابات على استفسارات الطلاب"
        />
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-main">قائمة الأسئلة والإجابات</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem} startIcon={<Plus className="w-3.5 h-3.5" />}>
              إضافة سؤال
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-bg border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">السؤال #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-danger hover:bg-danger-bg rounded-md"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  label="نص السؤال"
                  value={item.question || ''}
                  onChange={(e) => updateItem(idx, 'question', e.target.value)}
                />
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-text-muted">الإجابة</label>
                  <textarea
                    rows={2}
                    value={item.answer || ''}
                    onChange={(e) => updateItem(idx, 'answer', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-main resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 7. CONTACT CONTENT EDITOR
  if (section.type === 'contact') {
    return (
      <div className="space-y-4 text-start">
        <Input
          label="عنوان القسم"
          value={content.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="مثال: تواصل معنا"
        />
        <Input
          label="النص الفرعي"
          value={content.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          placeholder="نحن هنا لمساعدتك في أي وقت"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="رقم الهاتف"
            value={content.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="01000000000"
          />
          <Input
            label="رقم الواتساب"
            value={content.whatsapp || ''}
            onChange={(e) => updateField('whatsapp', e.target.value)}
            placeholder="01000000000"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="البريد الإلكتروني"
            value={content.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="info@example.com"
          />
          <Input
            label="العنوان أو المقر"
            value={content.address || ''}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="القاهرة - مصر"
          />
        </div>
      </div>
    );
  }

  // 8. FOOTER CONTENT EDITOR
  if (section.type === 'footer') {
    return (
      <div className="space-y-4 text-start">
        <Input
          label="نص حقوق النشر (Copyright)"
          value={content.copyrightText || ''}
          onChange={(e) => updateField('copyrightText', e.target.value)}
          placeholder="جميع الحقوق محفوظة © 2026"
        />
      </div>
    );
  }

  return null;
};
