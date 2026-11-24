import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Accordion from '@radix-ui/react-accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroContent, LandingTheme } from '../types';
import { tenantPath } from '@/lib/tenant';
import { getRadiusClass, getButtonStyleClasses } from './common';
import {
  staggerContainer,
  fadeUpItem,
  blurUp,
  scaleReveal,
  slideInFromEnd,
  EASE_OUT_EXPO,
} from './motion';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  KeyRound,
  Clock,
  ChevronLeft,
  ChevronDown,
  PlayCircle,
  Award,
  Layers,
} from 'lucide-react';

interface HeroSectionProps {
  content: HeroContent;
  variant: string;
  theme?: LandingTheme;
}

interface CurriculumChapter {
  id: string;
  number: string;
  title: string;
  lecturesCount: string;
  pdfCount: string;
  duration: string;
  topics: string[];
}

interface SubjectMagazinePreset {
  teacherRole: string;
  gradeBadge: string;
  defaultPortraitUrl: string;
  experienceLabel: string;
  scheduleNote: string;
  chapters: CurriculumChapter[];
}

/** Resolves subject-specific curriculum chapters and portrait for the Academic Magazine Hero */
function resolveMagazinePreset(title: string, subtitle: string): SubjectMagazinePreset {
  const combined = `${title} ${subtitle}`;

  if (combined.includes('فيزياء') || combined.includes('حسام')) {
    return {
      teacherRole: 'خبير الفيزياء الكهربية والحديثة للثانوية العامة',
      gradeBadge: 'الصف الثالث الثانوي • علمي علوم ورياضة',
      defaultPortraitUrl: '/images/teachers/teacher-physics.jpg',
      experienceLabel: '+14 عاماً في تدريس الفيزياء',
      scheduleNote: 'محاضرتان أسبوعياً (شرح + حل كتاب الامتحان ونيوتن)',
      chapters: [
        {
          id: 'ch-1',
          number: 'الباب الأول',
          title: 'التيار الكهربي وقانون أوم وقانونا كيرشوف',
          lecturesCount: '12 محاضرة',
          pdfCount: '4 ملازم PDF',
          duration: '18 ساعة شرح وحل',
          topics: [
            'شدة التيار وفرق الجهد والمقاومة النوعية وتوصيل المقاومات',
            'قانون أوم للدائرة المغلقة وقراءات الأميتر والفولتميتر',
            'قانونا كيرشوف وحل دوائر المستويات العليا بالآلة الحاسبة',
          ],
        },
        {
          id: 'ch-2',
          number: 'الباب الثاني',
          title: 'التأثير المغناطيسي للتيار الكهربي وأجهزة القياس',
          lecturesCount: '14 محاضرة',
          pdfCount: '5 ملازم PDF',
          duration: '20 ساعة شرح وحل',
          topics: [
            'الفيض المغناطيسي لسلك مستقيم وملف دائري وملف لولبي',
            'القوة المغناطيسية وعزم الازدواج المؤثر على ملف',
            'الجلفانومتر والأميتر والفولتميتر والأوميتر ومسائل المعايرة',
          ],
        },
        {
          id: 'ch-3',
          number: 'الباب الثالث',
          title: 'الحث الكهرومغناطيسي والدينامو والمحول الكهربي',
          lecturesCount: '15 محاضرة',
          pdfCount: '5 ملازم PDF',
          duration: '22 ساعة شرح وحل',
          topics: [
            'قانون فاراداي وقاعدة لنز والحث المتبادل والحث الذاتي',
            'المولد الكهربي (الدينامو) وحساب القيمة الفعالة والمتوسطة',
            'المحول الكهربي والمحرك الكهربي وتطبيقات نقل الطاقة',
          ],
        },
      ],
    };
  }

  if (combined.includes('رياضيات') || combined.includes('الشافعي') || combined.includes('تفاضل')) {
    return {
      teacherRole: 'كبير معلمي الرياضيات البحتة والتطبيقية للثانوية العامة',
      gradeBadge: 'الصف الثالث الثانوي • علمي رياضة',
      defaultPortraitUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
      experienceLabel: '+15 عاماً في تدريس الرياضيات',
      scheduleNote: '3 محاضرات أسبوعياً مع حل كتاب المعاصر كاملاً',
      chapters: [
        {
          id: 'ch-1',
          number: 'الفرع الأول',
          title: 'التفاضل والتكامل وتطبيقات القيم العظمى والصغرى',
          lecturesCount: '18 محاضرة',
          pdfCount: '6 ملازم PDF',
          duration: '26 ساعة شرح وحل',
          topics: [
            'اشتقاق الدوال المثلثية والاشتقاق الضمني والبارامتري والمشتقات العليا',
            'معادلتي المماس والعمودي والمعدلات الزمنية المرتبطة',
            'الدوال الأسية واللوغاريتمية وطرق التكامل والمساحات والحجوم',
          ],
        },
        {
          id: 'ch-2',
          number: 'الفرع الثاني',
          title: 'الجبر والهندسة الفراغية والمحددات والمصفوفات',
          lecturesCount: '16 محاضرة',
          pdfCount: '5 ملازم PDF',
          duration: '22 ساعة شرح وحل',
          topics: [
            'مبدأ العد والتباديل والتوافيق ونظرية ذات الحدين والأعداد المركبة',
            'المحددات والمصفوفات وحل المعادلات الخطية بطريقة كرامر',
            'المتجهات في الفراغ والضرب القياسي والاتجاهي ومعادلة الكرة والمستقيم',
          ],
        },
        {
          id: 'ch-3',
          number: 'الفرع الثالث',
          title: 'الاستاتيكا والديناميكا والإحصاء التطبيقي',
          lecturesCount: '20 محاضرة',
          pdfCount: '6 ملازم PDF',
          duration: '28 ساعة شرح وحل',
          topics: [
            'اتزان جسم على مستوى خشن، العزوم، القوى المتوازية، والاتزان العام',
            'تفاضل وتكامل الدوال المتجهة وقوانين نيوتن للحركة والدفع والتصادم',
            'الشغل وطاقة الحركة وطاقة الوضع والاحتمالات والمتغيرات العشوائية',
          ],
        },
      ],
    };
  }

  if (combined.includes('عربي') || combined.includes('العربية') || combined.includes('السوهاجي')) {
    return {
      teacherRole: 'عميد اللغة العربية والنحو والبلاغة للثانوية العامة',
      gradeBadge: 'الصف الثالث الثانوي • الدرجة النهائية 80/80',
      defaultPortraitUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&q=85',
      experienceLabel: '+19 عاماً في تدريس اللغة العربية',
      scheduleNote: 'محاضرتان أسبوعياً + امتحان نصوص وقراءة متحررة',
      chapters: [
        {
          id: 'ch-1',
          number: 'القسم الأول',
          title: 'النحو الشامل (الوحدات السبع وتطبيقات الإعراب)',
          lecturesCount: '22 محاضرة',
          pdfCount: '7 ملازم PDF',
          duration: '32 ساعة شرح وحل',
          topics: [
            'النطق والإملاء والأبنية (المشتقات العاملة والمصادر والمنقوص والممدود)',
            'النواسخ (كان وكاد وإنّ ولا النافية للجنس) وأحكام المبتدأ والخبر',
            'إعراب الفعل المضارع والمنصوبات والمجرورات والأساليب النحوية',
          ],
        },
        {
          id: 'ch-2',
          number: 'القسم الثاني',
          title: 'الأدب الحديث ومدارس الشعر والنصوص المتحررة',
          lecturesCount: '16 محاضرة',
          pdfCount: '5 ملازم PDF',
          duration: '24 ساعة شرح وحل',
          topics: [
            'مدرسة الإحياء والبعث والاتجاه الوجداني (مطران) ومدرسة الديوان',
            'مدرسة أبولو ومدرسة المهاجر والمدرسة الواقعية في الشعر العربي',
            'فنون النثر الحديث: المقال، القصة القصيرة، الرواية، والمسرحية',
          ],
        },
        {
          id: 'ch-3',
          number: 'القسم الثالث',
          title: 'البلاغة التطبيقية والقراءة المتحررة والتعبير',
          lecturesCount: '14 محاضرة',
          pdfCount: '4 ملازم PDF',
          duration: '18 ساعة شرح وحل',
          topics: [
            'التجربة الشعرية والوحدة الفنية والصور الجزئية والكلية والممتدة',
            'استراتيجيات تحليل مقالات القراءة المتحررة العلمية والأدبية',
            'أنماط التعبير الاختباري والمقالي الواردة في امتحانات الوزارة',
          ],
        },
      ],
    };
  }

  if (combined.includes('أحياء') || combined.includes('سلمى')) {
    return {
      teacherRole: 'أستاذة الأحياء والجيولوجيا للثانوية العامة',
      gradeBadge: 'الصف الثالث الثانوي • علمي علوم',
      defaultPortraitUrl: '/images/teachers/teacher-bio.jpg',
      experienceLabel: '+13 عاماً في تدريس الأحياء',
      scheduleNote: 'محاضرتان أسبوعياً بالرسوم الطبية + حل كتاب الامتحان والتفوق',
      chapters: [
        {
          id: 'ch-1',
          number: 'الباب الأول',
          title: 'التركيب والوظيفة: الدعامة والحركة والتنسيق الهرموني',
          lecturesCount: '14 محاضرة',
          pdfCount: '4 ملازم PDF',
          duration: '20 ساعة شرح وحل',
          topics: [
            'الدعامة الفسيولوجية والتركيبية في النبات والهيكل العظمي في الإنسان',
            'آلية انقباض العضلة الهيكلية ونظرية الخيوط المنزلقة وحساب الوحدات الحركية',
            'الغدد الصماء في الإنسان (النخامية والدرقية والبنكرياس والغدتان الكظريتان)',
          ],
        },
        {
          id: 'ch-2',
          number: 'الباب الثاني',
          title: 'التكاثر في الكائنات الحية والمناعة في النبات والإنسان',
          lecturesCount: '18 محاضرة',
          pdfCount: '6 ملازم PDF',
          duration: '26 ساعة شرح وحل',
          topics: [
            'صور التكاثر اللاجنسي والجنسي وتعاقب الأجيال والتكاثر في النباتات الزهرية',
            'التكاثر في الإنسان ومراحل تكوين الجنين ووسائل الإخصاب المساعد',
            'المناعة التركيبية والبيوكيميائية والخلايا الليمفاوية (B و T) والأجسام المضادة',
          ],
        },
        {
          id: 'ch-3',
          number: 'الباب الثالث',
          title: 'البيولوجيا الجزيئية: الحمض النووي DNA والأحماض الريبوزية RNA',
          lecturesCount: '12 محاضرة',
          pdfCount: '4 ملازم PDF',
          duration: '18 ساعة شرح وحل',
          topics: [
            'أدلة إثبات أن DNA هو المادة الوراثية وتركيب اللولب المزدوج وتضاعفه',
            'أوليات وحقيقيات النواة والطفرات الوراثية وأنواع الأحماض النووية RNA',
            'تخليق البروتين والشفرة الوراثية وتكنولوجيا DNA معاد الاتحاد والهندسة الوراثية',
          ],
        },
      ],
    };
  }

  // Default: Chemistry (أ. طارق المنشاوي)
  return {
    teacherRole: 'خبير الكيمياء للثانوية العامة والأزهرية',
    gradeBadge: 'الصف الثالث الثانوي • علمي علوم ورياضة',
    defaultPortraitUrl: '/images/teachers/teacher-chem.jpg',
    experienceLabel: '+16 عاماً في تدريس الكيمياء',
    scheduleNote: 'محاضرتان أسبوعياً (شرح السبورة + حل كتاب الامتحان ومندليف)',
    chapters: [
      {
        id: 'ch-1',
        number: 'الباب الأول',
        title: 'العناصر الانتقالية واستخلاص الحديد وتفاعلات أكاسيده',
        lecturesCount: '10 محاضرات',
        pdfCount: '3 ملازم PDF',
        duration: '15 ساعة شرح وحل',
        topics: [
          'التوزيع الإلكتروني وحالات التأكسد والخواص المغناطيسية والنشاط الحفزي',
          'تجهيز خامات الحديد والاختزال في الفرن العالي وفرن مدركس وإنتاج الصلب',
          'مخطط تحويلات الحديد وأكاسيده الثلاثة (FeO / Fe2O3 / Fe3O4) والسبائك',
        ],
      },
      {
        id: 'ch-2',
        number: 'الباب الثاني والثالث',
        title: 'التحليل الكيميائي الكمي والكيفي والاتزان الكيميائي والأيوني',
        lecturesCount: '16 محاضرة',
        pdfCount: '5 ملازم PDF',
        duration: '24 ساعة شرح وحل',
        topics: [
          'الكشف عن الأنيونات والكاتيونات ومسائل المعايرة والتطاير والترسيب',
          'قاعدة لوشاتيليه وحساب ثابت الاتزان Kc و Kp وتأثير الحرارة والضغط',
          'الاتزان الأيوني وقانون استفالد وحساب الأس الهيدروجيني pH وحاصل الإذابة Ksp',
        ],
      },
      {
        id: 'ch-3',
        number: 'الباب الرابع والخامس',
        title: 'الكيمياء الكهربية والكيمياء العضوية (الهيدروكربونات والمشتقات)',
        lecturesCount: '22 محاضرة',
        pdfCount: '7 ملازم PDF',
        duration: '34 ساعة شرح وحل',
        topics: [
          'الخلايا الجلفانية والبطاريات وقوانين فاراداي للتحليل الكهربي وحماية المعادن',
          'تسمية الألكانات والألكينات والألكاينات والبنزين العطري وتفاعلاتها',
          'الكحولات والفينولات والأحماض الكربوكسيلية والإسترات ومخططات التحويلات العضوية',
        ],
      },
    ],
  };
}

/** Academic Magazine Cover + Interactive Chapters Accordion (Static, Editorial, Zero 3D Wobble) */
const AcademicMagazineCoverShowcase: React.FC<{
  radiusClass: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
}> = ({ radiusClass, imageUrl, title, subtitle }) => {
  const preset = resolveMagazinePreset(title, subtitle);
  const [openChapter, setOpenChapter] = useState<string>('ch-1');

  // Use teacher portrait if provided and not an old generic study desk image
  const isGenericUnsplash =
    !imageUrl ||
    imageUrl.includes('photo-1523240795612') ||
    imageUrl.includes('photo-1532094349884');
  const portraitSrc = isGenericUnsplash ? preset.defaultPortraitUrl : imageUrl;

  return (
    <div
      className={`overflow-hidden bg-surface border border-border shadow-[0_22px_55px_-16px_rgba(28,25,23,0.12)] ${radiusClass}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12">
        {/* Right Side (in RTL): Full Vertical Editorial Teacher Portrait */}
        <div className="sm:col-span-5 relative bg-surface-subtle min-h-[340px] sm:min-h-[450px] overflow-hidden border-b sm:border-b-0 sm:border-e border-border">
          <img
            src={portraitSrc}
            alt={title}
            className="w-full h-full object-cover object-[50%_18%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(28,25,23,0.02) 0%, rgba(28,25,23,0.15) 55%, rgba(28,25,23,0.92) 100%)',
            }}
          />

          {/* Top Grade Badge */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-lg bg-surface/95 text-text-main text-[11px] font-bold shadow-xs border border-border/60">
              {preset.gradeBadge}
            </span>
          </div>

          {/* Bottom Portrait Caption */}
          <div className="absolute inset-x-0 bottom-0 p-4 text-white space-y-1.5 text-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[11px] font-bold">
              <Award className="w-3 h-3 text-secondary" />
              <span>{preset.experienceLabel}</span>
            </div>
            <p className="text-xs font-bold text-white/95 leading-snug">
              {preset.teacherRole}
            </p>
            <p className="text-[11px] text-white/75 flex items-center gap-1">
              <Clock className="w-3 h-3 text-secondary shrink-0" />
              <span>{preset.scheduleNote}</span>
            </p>
          </div>
        </div>

        {/* Left Side (in RTL): Interactive Curriculum Chapters Index */}
        <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between bg-surface text-start">
          <div className="space-y-4">
            {/* Magazine Index Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-heading text-text-main">
                    فهرس أبواب المنهج والملازم
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    اضغط على أي باب لاستعراض المحاضرات والمذكرات
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary-subtle px-2.5 py-1 rounded-md tabular-nums">
                {preset.chapters.length} أبواب رئيسية
              </span>
            </div>

            {/* Chapters Accordion powered by @radix-ui/react-accordion */}
            <Accordion.Root
              type="single"
              collapsible
              value={openChapter}
              onValueChange={setOpenChapter}
              className="space-y-2.5"
            >
              {preset.chapters.map((ch) => {
                const isOpen = openChapter === ch.id;
                return (
                  <Accordion.Item
                    key={ch.id}
                    value={ch.id}
                    className={`rounded-xl border transition-colors overflow-hidden ${
                      isOpen
                        ? 'bg-bg border-primary/40'
                        : 'bg-surface border-border hover:border-primary/25'
                    }`}
                  >
                    <Accordion.Header className="m-0">
                      <Accordion.Trigger className="w-full p-3.5 text-start flex items-center justify-between gap-3 cursor-pointer">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                              {ch.number}
                            </span>
                            <span className="text-[11px] font-semibold text-text-muted tabular-nums flex items-center gap-1">
                              <PlayCircle className="w-3 h-3 text-primary" />
                              <span>{ch.lecturesCount}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-text-muted tabular-nums flex items-center gap-1">
                              <FileText className="w-3 h-3 text-secondary" />
                              <span>{ch.pdfCount}</span>
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-text-main leading-snug">
                            {ch.title}
                          </div>
                        </div>
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isOpen
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-bg text-text-muted'
                          }`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </span>
                      </Accordion.Trigger>
                    </Accordion.Header>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <Accordion.Content forceMount asChild>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 pt-2 border-t border-border-subtle space-y-2">
                              {ch.topics.map((topic, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-xs text-text-muted leading-relaxed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                  <span>{topic}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        </Accordion.Content>
                      )}
                    </AnimatePresence>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
          </div>

          {/* Bottom Direct Link to All Subjects */}
          <div className="mt-4 pt-3.5 border-t border-border-subtle flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-text-muted">
              تتضمن كل محاضرة ملزمة PDF وكويز تقييمي
            </span>
            <Link
              to={tenantPath('/subjects')}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>عرض جميع الأبواب</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({ content, variant, theme }) => {
  const navigate = useNavigate();
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const primaryBtnClass = getButtonStyleClasses(theme?.buttonStyle, true);
  const secondaryBtnClass = getButtonStyleClasses(theme?.buttonStyle, false);

  const handleJoinCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCodeInput.trim();
    const target = trimmed ? `/register?joinCode=${encodeURIComponent(trimmed)}` : '/register';
    navigate(tenantPath(target));
  };

  const renderButton = (text: string, link: string, isPrimary: boolean, onDark = false) => {
    const isInternal = link.startsWith('/');
    const darkSecondary =
      onDark && !isPrimary
        ? 'bg-white/10 text-white border border-white/25 hover:bg-white/20 font-semibold backdrop-blur-sm'
        : '';

    const btnClass = `group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base cursor-pointer active:scale-[0.98] transition-transform ${
      darkSecondary || (isPrimary ? primaryBtnClass : secondaryBtnClass)
    } ${radiusClass}`;

    const icon = isPrimary ? (
      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
    ) : (
      <BookOpen className="w-4 h-4 opacity-80" />
    );

    if (isInternal) {
      return (
        <Link to={tenantPath(link)} className={btnClass}>
          <span>{text}</span>
          {icon}
        </Link>
      );
    }
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <span>{text}</span>
        {icon}
      </a>
    );
  };

  /* ── 1. Full Background Variant ─────────────────────────────────── */
  if (variant === 'fullBackground') {
    return (
      <section className="relative min-h-[600px] sm:min-h-[660px] flex items-center justify-center text-center overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
        {content.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <motion.img
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1.01, opacity: 0.32 }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-full object-cover object-[50%_20%]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(2,6,23,0.82) 0%, rgba(2,6,23,0.62) 50%, color-mix(in srgb, var(--color-primary) 38%, rgba(2,6,23,0.95)) 100%)',
              }}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 38%, transparent), transparent 55%), linear-gradient(135deg, #020617 0%, #0f172a 100%)',
            }}
          />
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl mx-auto space-y-7"
        >
          <motion.h1
            variants={blurUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading leading-[1.48] text-balance"
          >
            {content.title}
          </motion.h1>
          <motion.p
            variants={fadeUpItem}
            className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            {content.subtitle}
          </motion.p>
          <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-center gap-4 pt-3">
            {content.primaryButtonText &&
              renderButton(content.primaryButtonText, content.primaryButtonLink || '/register', true, true)}
            {content.secondaryButtonText &&
              renderButton(content.secondaryButtonText, content.secondaryButtonLink || '/subjects', false, true)}
          </motion.div>
        </motion.div>
      </section>
    );
  }

  /* ── 2. Centered Variant ────────────────────────────────────────── */
  if (variant === 'centered') {
    return (
      <section
        className="relative py-20 sm:py-28 text-center overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 50% 0%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 72%)',
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10"
        >
          <motion.h1
            variants={blurUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text-main leading-[1.48] text-balance"
          >
            {content.title}
          </motion.h1>
          <motion.p variants={fadeUpItem} className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            {content.subtitle}
          </motion.p>
          <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-center gap-4 pt-1">
            {content.primaryButtonText &&
              renderButton(content.primaryButtonText, content.primaryButtonLink || '/register', true)}
            {content.secondaryButtonText &&
              renderButton(content.secondaryButtonText, content.secondaryButtonLink || '/subjects', false)}
          </motion.div>

          <motion.div variants={scaleReveal} className="pt-8 text-start">
            <AcademicMagazineCoverShowcase
              radiusClass={radiusClass}
              imageUrl={content.imageUrl}
              title={content.title}
              subtitle={content.subtitle}
            />
          </motion.div>
        </motion.div>
      </section>
    );
  }

  /* ── 3. Split Variant (Default) — Academic Magazine Cover & Chapters ── */
  return (
    <section
      className="relative py-14 sm:py-22 overflow-hidden border-b border-border-subtle"
      style={{
        background:
          'radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--color-primary) 11%, transparent), transparent 52%), radial-gradient(circle at 86% 82%, color-mix(in srgb, var(--color-secondary) 10%, transparent), transparent 50%), linear-gradient(180deg, #FFFDF9 0%, var(--color-bg) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Right Column (5 cols): Editorial Teacher Heading, CTAs & Group Code Input */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 space-y-6 text-start"
          >
            <motion.h1
              variants={blurUp}
              className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold font-heading text-text-main leading-[1.48] text-balance"
            >
              {content.title}
            </motion.h1>
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.9]">
              {content.subtitle}
            </motion.p>
            <motion.div variants={fadeUpItem} className="flex flex-wrap items-center gap-3.5 pt-1">
              {content.primaryButtonText &&
                renderButton(content.primaryButtonText, content.primaryButtonLink || '/register', true)}
              {content.secondaryButtonText &&
                renderButton(content.secondaryButtonText, content.secondaryButtonLink || '/subjects', false)}
            </motion.div>

            {/* Clean Private Group Code Entry Box */}
            <motion.form
              variants={fadeUpItem}
              onSubmit={handleJoinCodeSubmit}
              className={`p-3.5 bg-surface border border-border shadow-xs space-y-2 ${radiusClass}`}
            >
              <label className="block text-xs font-bold text-text-main">
                لطلاب المجموعات المسجلين — أدخل كود المجموعة الخاص بك:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-text-muted absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="اكتب كود المجموعة هنا..."
                    aria-label="كود المجموعة للانضمام السريع"
                    className="w-full ps-9 pe-3 py-2 text-xs font-semibold bg-bg border border-border rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-1 shrink-0"
                >
                  <span>دخول</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.form>
          </motion.div>

          {/* Left Column (7 cols): Academic Magazine Cover Portrait + Chapters Index */}
          <motion.div
            variants={slideInFromEnd}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7"
          >
            <AcademicMagazineCoverShowcase
              radiusClass={radiusClass}
              imageUrl={content.imageUrl}
              title={content.title}
              subtitle={content.subtitle}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
