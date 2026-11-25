import { LandingPageConfig, LandingSection, LandingTheme } from './types';

export interface LandingTemplate {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  theme: Omit<LandingTheme, 'heroImageUrl'>;
  sectionPlan: Array<{
    type: LandingSection['type'];
    variant: string;
    enabled: boolean;
  }>;
}

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: 'editorial-classic',
    name: 'المجلة الأكاديمية (Editorial Classic)',
    subtitle: 'تصميم الورق الدافئ المقسّم بصورة الأستاذ وفهرس المنهج التفاعلي — مثالي لمدرسي الثانوية العامة.',
    badge: 'الأكثر طلباً',
    theme: {
      primaryColor: '#3730A3',
      secondaryColor: '#D97706',
      backgroundColor: '#FAF7F2',
      textColor: '#1C1917',
      fontFamily: 'IBM Plex Sans Arabic',
      borderRadius: 'xl',
      buttonStyle: 'solid',
    },
    sectionPlan: [
      { type: 'hero', variant: 'split', enabled: true },
      { type: 'stats', variant: 'cards', enabled: true },
      { type: 'about', variant: 'split', enabled: true },
      { type: 'subjects', variant: 'grid', enabled: true },
      { type: 'testimonials', variant: 'grid', enabled: true },
      { type: 'faq', variant: 'accordion', enabled: true },
      { type: 'contact', variant: 'split', enabled: true },
      { type: 'footer', variant: 'columns', enabled: true },
    ],
  },
  {
    id: 'modern-spotlight',
    name: 'الأضواء العصرية (Modern Spotlight)',
    subtitle: 'واجهة متمركزة بعرض شرائح دائري للمواد وآراء الطلاب المقتبسة مع هوية تركوازية هادئة.',
    badge: 'تفاعلي',
    theme: {
      primaryColor: '#0F766E',
      secondaryColor: '#D97706',
      backgroundColor: '#FBF8F3',
      textColor: '#1C1917',
      fontFamily: 'Cairo',
      borderRadius: 'xl',
      buttonStyle: 'soft',
    },
    sectionPlan: [
      { type: 'hero', variant: 'centered', enabled: true },
      { type: 'stats', variant: 'inline', enabled: true },
      { type: 'subjects', variant: 'carousel', enabled: true },
      { type: 'about', variant: 'card', enabled: true },
      { type: 'testimonials', variant: 'quotes', enabled: true },
      { type: 'faq', variant: 'twoColumns', enabled: true },
      { type: 'contact', variant: 'cards', enabled: true },
      { type: 'footer', variant: 'simple', enabled: true },
    ],
  },
  {
    id: 'cinematic-academy',
    name: 'الأكاديمية السينمائية (Cinematic Banner)',
    subtitle: 'غلاف كامل في الصدارة مع شبكة مواد وأسئلة شائعة في بطاقات، مناسب للأكاديميات والمراجعات النهائية.',
    badge: 'مكثّف',
    theme: {
      primaryColor: '#9F1239',
      secondaryColor: '#D97706',
      backgroundColor: '#FAF7F2',
      textColor: '#1C1917',
      fontFamily: 'Tajawal',
      borderRadius: 'md',
      buttonStyle: 'solid',
    },
    sectionPlan: [
      { type: 'hero', variant: 'fullBackground', enabled: true },
      { type: 'subjects', variant: 'grid', enabled: true },
      { type: 'stats', variant: 'grid', enabled: true },
      { type: 'about', variant: 'compact', enabled: true },
      { type: 'testimonials', variant: 'carousel', enabled: true },
      { type: 'faq', variant: 'cards', enabled: true },
      { type: 'contact', variant: 'compact', enabled: true },
      { type: 'footer', variant: 'columns', enabled: true },
    ],
  },
  {
    id: 'minimal-curriculum',
    name: 'البساطة والتركيز على المنهج (Minimal Focus)',
    subtitle: 'ترتيب مختصر يضع قائمة المواد مباشرة بعد الترحيب لتسجيل سريع بدون تشتيت.',
    badge: 'سريع وخفيف',
    theme: {
      primaryColor: '#1E3A5F',
      secondaryColor: '#C2410C',
      backgroundColor: '#FAF9F6',
      textColor: '#1C1917',
      fontFamily: 'Almarai',
      borderRadius: 'md',
      buttonStyle: 'outline',
    },
    sectionPlan: [
      { type: 'hero', variant: 'centered', enabled: true },
      { type: 'subjects', variant: 'list', enabled: true },
      { type: 'about', variant: 'compact', enabled: true },
      { type: 'stats', variant: 'inline', enabled: true },
      { type: 'testimonials', variant: 'grid', enabled: false },
      { type: 'faq', variant: 'accordion', enabled: true },
      { type: 'contact', variant: 'compact', enabled: true },
      { type: 'footer', variant: 'minimal', enabled: true },
    ],
  },
];

/**
 * Applies a chosen layout template while preserving all teacher-written text & uploaded images.
 */
export function applyLandingTemplate(
  current: LandingPageConfig,
  template: LandingTemplate
): LandingPageConfig {
  const existingByType = new Map(current.sections.map((s) => [s.type, s]));
  const orderedSections: LandingSection[] = [];

  for (const plan of template.sectionPlan) {
    const existing = existingByType.get(plan.type);
    if (existing) {
      orderedSections.push({
        ...existing,
        variant: plan.variant,
        enabled: plan.enabled,
      });
      existingByType.delete(plan.type);
    }
  }

  for (const leftover of existingByType.values()) {
    orderedSections.push(leftover);
  }

  return {
    ...current,
    theme: {
      ...template.theme,
      heroImageUrl: current.theme.heroImageUrl,
    },
    sections: orderedSections,
  };
}
