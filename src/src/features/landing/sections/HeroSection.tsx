import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { HeroContent, LandingTheme } from '../types';
import { tenantPath } from '@/lib/tenant';
import { getRadiusClass, getButtonStyleClasses } from './common';
import { triggerQuizSuccessConfetti } from '../adapters/celebrationAdapter';
import {
  staggerContainer,
  fadeUpItem,
  blurUp,
  scaleReveal,
  slideInFromEnd,
  drawLine,
  EASE_OUT_EXPO,
} from './motion';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Pause,
  CheckCircle2,
  FileText,
  HelpCircle,
  KeyRound,
  Volume2,
  Clock,
  ChevronLeft,
} from 'lucide-react';

interface HeroSectionProps {
  content: HeroContent;
  variant: string;
  theme?: LandingTheme;
}

interface SubjectCurriculumPreset {
  badge: string;
  lessonTitle: string;
  duration: string;
  videoPoints: string[];
  pdfTitle: string;
  pdfPages: string;
  pdfPoints: string[];
  quizQuestion: string;
  quizOptions: string[];
  quizCorrectIndex: number;
  quizExplanation: string;
}

/** Detects the teacher's subject from the title/subtitle and returns authentic Thanawya Amma lesson data */
function resolveSubjectPreset(title: string, subtitle: string): SubjectCurriculumPreset {
  const combined = `${title} ${subtitle}`;

  if (combined.includes('فيزياء') || combined.includes('حسام')) {
    return {
      badge: 'الباب الأول • التيار الكهربي وقانونا كيرشوف',
      lessonTitle: 'المحاضرة (4): إتقان مسائل قانوني كيرشوف وحل كتاب الامتحان',
      duration: '52:15 دقيقة',
      videoPoints: [
        'تحديد اتجاهات المسارات المغلقة وإشارات فرق الجهد بدون أخطاء',
        'طريقة الآلة الحاسبة لحل 3 معادلات في 3 مجاهيل في أقل من 30 ثانية',
        'حل أصعب 15 مسألة مستويات عليا من كتاب الامتحان ونيوتن',
      ],
      pdfTitle: 'ملزمة الباب الأول: الكهربية التيارية وقوانين أوم وكيرشوف',
      pdfPages: '28 صفحة',
      pdfPoints: [
        'مخطط ذهني لجميع قوانين التوصيل على التوالي والتوازي وقراءة الأميتر والفولتميتر',
        'واجب الحصة (60 سؤال اختيار من متعدد بنظام البابل شيت)',
        'نموذج الإجابة التفصيلي بالخطوات لكل مسألة في الواجب',
      ],
      quizQuestion: 'سؤال امتحان ثانوية عامة: يعتمد القانون الأول لكيرشوف (عند نقطة تفرع في دائرة كهربية) على مبدأ حفظ:',
      quizOptions: [
        'الشحنة الكهربية (مجموع التيارات الداخلة = مجموع التيارات الخارجة)',
        'الطاقة الكهربية والقوة الدافعة الكهربية',
        'كمية التحرك الخطية للإلكترونات',
      ],
      quizCorrectIndex: 0,
      quizExplanation: 'إجابة صحيحة! القانون الأول لكيرشوف يعبر عن حفظ الشحنة الكهربية، بينما القانون الثاني يعبر عن حفظ الطاقة.',
    };
  }

  if (combined.includes('رياضيات') || combined.includes('الشافعي') || combined.includes('تفاضل')) {
    return {
      badge: 'التفاضل والتكامل • تالتة ثانوي علمي رياضة',
      lessonTitle: 'المحاضرة (3): اشتقاق الدوال المثلثية والاشتقاق الضمني والبارامتري',
      duration: '48:30 دقيقة',
      videoPoints: [
        'ربط قواعد الاشتقاق الضمني بميل المماس والعمودي لمنحنى الدالة',
        'إثبات المشتقات العليا للدوال المثلثية بأقصر خطوات جبرية',
        'حل تمارين كتاب المعاصر وأسئلة امتحانات الأعوام السابقة',
      ],
      pdfTitle: 'ملزمة الوحدة الأولى: التفاضل وتطبيقات المشتقات العليا',
      pdfPages: '32 صفحة',
      pdfPoints: [
        'تجميعة قوانين حساب المثلثات التراكمية اللازمة لحل مسائل التفاضل',
        'بنك أسئلة المعاصر متدرج من المستوى الأساسي حتى مسائل المتفوقين',
        'خطوات الحل النموذجية الموضحة بالرسم البياني',
      ],
      quizQuestion: 'سؤال تفاضل تالتة ثانوي: إذا كانت ص = جا(2س)، فإن المشتقة الأولى (د ص / د س) عند س = 0 تساوي:',
      quizOptions: [
        '2 (لأن د ص/د س = 2 جتا 2س، وعند س=0 تكون 2 × 1 = 2)',
        '0 (لأن جا 0 = 0)',
        '-2 (لأن مشتقة الجيب سالب جيب تمام)',
      ],
      quizCorrectIndex: 0,
      quizExplanation: 'أحسنت! مشتقة جا(2س) هي 2 جتا(2س)، وبالتعويض عن س = 0 نجد 2 × جتا(0) = 2 × 1 = 2.',
    };
  }

  if (combined.includes('عربي') || combined.includes('العربية') || combined.includes('السوهاجي')) {
    return {
      badge: 'النحو والبلاغة • تالتة ثانوي (الدرجة النهائية 80/80)',
      lessonTitle: 'المحاضرة (5): إتقان الوحدة الثالثة في النحو (المبتدأ والخبر والنواسخ)',
      duration: '55:10 دقيقة',
      videoPoints: [
        'مفاتيح إعراب الجمل وأشباه الجمل ومواضع تقديم الخبر وجوباً وجوازاً',
        'الفرق الدقيق بين كان التامة وكان الناقصة وكاد وأخواتها في الامتحان',
        'تطبيق عملي على النصوص المتحررة لمدرسة الإحياء والبعث وأسئلة البلاغة',
      ],
      pdfTitle: 'مذكرة العميد في النحو والنصوص المتحررة — الوحدة الثالثة',
      pdfPages: '36 صفحة',
      pdfPoints: [
        'خرائط ذهنية جامعة لأحكام المبتدأ والخبر وحذفها وجوباً',
        '100 سؤال نحو من امتحانات الثانوية العامة التجريبية والرسمية',
        'تدريبات قراءة ونصوص متحررة مع نموذج الإجابة والتعليل',
      ],
      quizQuestion: 'سؤال نحو ثانوية عامة: «لولا العلمُ ما تقدّمَ البشرُ» — إعراب كلمة (العلمُ) وحكم خبرها:',
      quizOptions: [
        'مبتدأ مرفوع، وخبره محذوف وجوباً تقديره (موجود)',
        'فاعل مرفوع لفعل محذوف يفسره ما بعده',
        'مبتدأ مرفوع، وخبره الجملة الفعلية (ما تقدم البشر)',
      ],
      quizCorrectIndex: 0,
      quizExplanation: 'ممتاز! الاسم الواقع بعد (لولا) يعرب مبتدأ وخبره محذوف وجوباً تقديره (موجود) لأنه كون عام.',
    };
  }

  if (combined.includes('أحياء') || combined.includes('سلمى')) {
    return {
      badge: 'الباب الأول • الدعامة والحركة في الكائنات الحية',
      lessonTitle: 'المحاضرة (3): آلية انقباض العضلة الهيكلية ونظرية الخيوط المنزلقة (هكسلي)',
      duration: '46:20 دقيقة',
      videoPoints: [
        'شرح ثلاثي الأبعاد للقطعة العضلية (الساركومير) وخيوط الأكتين والميوسين',
        'تتبع دور أيونات الكالسيوم Ca++ وجزيئات ATP في الانقباض والانبساط',
        'قوانين حساب عدد الوحدات الحركية والألياف العضلية واللويفات بسهولة',
      ],
      pdfTitle: 'ملزمة الدعامة والحركة بالرسوم الطبية التوضيحية',
      pdfPages: '26 صفحة',
      pdfPoints: [
        'رسومات ملونة عالية الدقة للفقرة العظمية والمفاصل والقطعة العضلية',
        'تجميعة قوانين مسائل العضلات والوحدات الحركية في صفحة واحدة',
        'حل أسئلة كتاب الامتحان وكتاب التفوق على الدعامة والحركة',
      ],
      quizQuestion: 'سؤال أحياء تالتة ثانوي: أي المناطق التالية في القطعة العضلية (الساركومير) يظل طولها ثابتاً أثناء الانقباض العضلي؟',
      quizOptions: [
        'المنطقة الداكنة (A) — لأنها تحتوي على خيوط الميوسين الثابتة',
        'المنطقة المضيئة (I)',
        'المنطقة شبه المضيئة (H)',
      ],
      quizCorrectIndex: 0,
      quizExplanation: 'إجابة ممتازة! المنطقة الداكنة (A) يبقى طولها ثابتاً بينما يقل طول المنطقة المضيئة (I) وشبه المضيئة (H).',
    };
  }

  // Default: Chemistry (أ. طارق المنشاوي)
  return {
    badge: 'الباب الأول • العناصر الانتقالية والحديد (تالتة ثانوي)',
    lessonTitle: 'المحاضرة (4): خواص الحديد وأكاسيده الثلاثة ومعادلات الفرن العالي ومدركس',
    duration: '49:40 دقيقة',
    videoPoints: [
      'مخطط تحويلات الحديد وأكاسيده (FeO / Fe2O3 / Fe3O4) بدون حفظ صم',
      'التفريق الفوري بين تفاعلات الأحماض المخففة والمركزة مع أكاسيد الحديد',
      'حل أصعب 40 سؤال من كتاب الامتحان ومندليف على الباب الأول',
    ],
    pdfTitle: 'ملزمة المعادلات الحديدية والسبائك — الباب الأول كيمياء',
    pdfPages: '24 صفحة',
    pdfPoints: [
      'خريطة معادلات الحديد المجمعة (تجهيز الخام + الاختزال + التفاعلات)',
      'جداول مقارنة السبائك الاستبدالية والبينفلزية والبينية بالأمثلة',
      'واجب الحصة بنظام البابل شيت مع الإجابات النموذجية المفسرة',
    ],
    quizQuestion: 'سؤال امتحان كيمياء ثانوية عامة: عند تسخين أوكسالات الحديد (II) بمعزل عن الهواء ينتج أكسيد الحديد (II)؛ لأن:',
    quizOptions: [
      'أول أكسيد الكربون (CO) الناتج عامل مختزل يمنع أكسدة FeO إلى Fe2O3',
      'ثاني أكسيد الكربون (CO2) الناتج عامل مؤكسد قوي',
      'أوكسالات الحديد (II) لا تنحل بالحرارة إلا في وجود الأكسجين',
    ],
    quizCorrectIndex: 0,
    quizExplanation: 'الله ينور عليك! غاز CO الناتج عن الانحلال يعمل كعامل مختزل يحمي أكسيد الحديد الثنائي من التأكسد.',
  };
}

/** Interactive Live Lesson Studio Component tailored for Thanawya Amma */
const InteractiveLessonStudio: React.FC<{
  radiusClass: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
}> = ({ radiusClass, imageUrl, title, subtitle }) => {
  const navigate = useNavigate();
  const preset = resolveSubjectPreset(title, subtitle);
  const [activeTab, setActiveTab] = useState<'video' | 'notes' | 'quiz'>('video');
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // 3D Spring Mouse Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4.5, -4.5]), {
    stiffness: 220,
    damping: 26,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4.5, 4.5]), {
    stiffness: 220,
    damping: 26,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleJoinCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCodeInput.trim();
    const target = trimmed ? `/register?joinCode=${encodeURIComponent(trimmed)}` : '/register';
    navigate(tenantPath(target));
  };

  const studioTabs = [
    { id: 'video', label: 'حصة الشرح' },
    { id: 'notes', label: 'ملزمة الـ PDF' },
    { id: 'quiz', label: 'كويز الحصة' },
  ];

  return (
    <div
      className="relative mx-auto max-w-xl lg:max-w-none"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={`relative overflow-hidden bg-surface border border-border shadow-[0_26px_65px_-18px_rgba(28,25,23,0.12)] ${radiusClass}`}
      >
        {/* Top Studio Window Bar — Warm Editorial Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-border"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 11%, #FFFDF9) 0%, color-mix(in srgb, var(--color-secondary) 8%, #FAF7F2) 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-xs font-extrabold tracking-wide text-text-main line-clamp-1">
              {preset.badge}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-md border border-border text-[11px] font-bold text-primary tabular-nums shrink-0">
            <Clock className="w-3 h-3 text-secondary" />
            <span>{preset.duration}</span>
          </div>
        </div>

        {/* Interactive Mode Switcher Tabs via @radix-ui/react-tabs */}
        <Tabs.Root
          dir="rtl"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'video' | 'notes' | 'quiz')}
        >
          <Tabs.List
            className="grid grid-cols-3 bg-bg p-1.5 gap-1.5 border-b border-border-subtle"
            aria-label="أدوات حصة الثانوية العامة"
          >
            {studioTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={`relative py-2 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected ? 'text-primary-foreground' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="heroStudioTabBg"
                      className="absolute inset-0 bg-primary rounded-lg"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.id === 'video' && <Play className="w-3.5 h-3.5" />}
                    {tab.id === 'notes' && <FileText className="w-3.5 h-3.5" />}
                    {tab.id === 'quiz' && <HelpCircle className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                  </span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
        </Tabs.Root>

        {/* Dynamic Studio Viewport */}
        <div className="p-5 sm:p-6 bg-surface min-h-[295px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="space-y-4"
              >
                {/* Video Stage — Warm Editorial Light Canvas */}
                <div
                  className="relative rounded-xl overflow-hidden border border-border aspect-[16/9] flex flex-col justify-between p-4 text-text-main"
                  style={{
                    background:
                      'radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 55%), linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 13%, #FFFDF9) 0%, color-mix(in srgb, var(--color-primary) 5%, #F4EFE6) 100%)',
                  }}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-multiply"
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-surface/90 border border-border text-[11px] font-bold text-primary">
                      جودة 1080p HD • شرح السبورة التفاعلية
                    </span>
                    <div className="w-7 h-7 rounded-full bg-surface/90 border border-border flex items-center justify-center text-primary">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Center Play/Pause Interactive Trigger */}
                  <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      aria-label={isPlaying ? 'إيقاف مؤقت لمعاينة الحصة' : 'تشغيل معاينة الحصة'}
                      className="w-13 h-13 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer ring-4 ring-surface"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 translate-x-0.5" />
                      )}
                    </button>
                    <p className="text-xs sm:text-sm font-extrabold text-text-main bg-surface/90 px-3 py-1 rounded-lg border border-border/80 line-clamp-1">
                      {preset.lessonTitle}
                    </p>
                  </div>

                  {/* Animated Timeline Scrubber */}
                  <div className="relative z-10 space-y-1.5 bg-surface/90 p-2.5 rounded-lg border border-border/80">
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: isPlaying ? ['22%', '78%', '22%'] : '45%' }}
                        transition={
                          isPlaying
                            ? { duration: 10, repeat: Infinity, ease: 'linear' }
                            : { duration: 0.3 }
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-text-muted tabular-nums">
                      <span className="text-primary">{isPlaying ? 'جاري عرض نموذج الحصة...' : 'متوقف مؤقتاً'}</span>
                      <span>21:10 / {preset.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Key Highlights */}
                <div className="grid grid-cols-1 gap-2">
                  {preset.videoPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-bg border border-border-subtle text-xs font-semibold text-text-main flex items-start gap-2 text-start"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-bg border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-primary-subtle text-primary flex items-center justify-center font-bold shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-start">
                        <h3 className="text-xs sm:text-sm font-bold text-text-main">{preset.pdfTitle}</h3>
                        <p className="text-xs text-text-muted">شاملة الشرح والواجب وإجابات كتاب الامتحان</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary-subtle px-2.5 py-1 rounded-md tabular-nums shrink-0">
                      PDF • {preset.pdfPages}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {preset.pdfPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface text-xs font-semibold text-text-main text-start"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold tabular-nums shrink-0">
                          {idx + 1}
                        </span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="space-y-3"
              >
                <div className="p-4 rounded-xl bg-bg border border-border-subtle space-y-3 text-start">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">سؤال من كويز الحصة (نظام البابل شيت)</span>
                    <span className="text-xs text-text-muted">جرّب الحل الآن</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-text-main leading-relaxed">
                    {preset.quizQuestion}
                  </p>
                  <div className="space-y-2">
                    {preset.quizOptions.map((opt, idx) => {
                      const isChosen = selectedQuizAnswer === idx;
                      const isCorrect = idx === preset.quizCorrectIndex;
                      let stateStyle = 'bg-surface border-border hover:border-primary/50 text-text-main';
                      if (selectedQuizAnswer !== null) {
                        if (isCorrect) {
                          stateStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                        } else if (isChosen) {
                          stateStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                        }
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            setSelectedQuizAnswer(idx);
                            if (idx === preset.quizCorrectIndex) {
                              triggerQuizSuccessConfetti(e.currentTarget);
                            }
                          }}
                          className={`w-full p-2.5 rounded-lg border text-xs font-semibold text-start transition-colors flex items-center justify-between gap-2 cursor-pointer ${stateStyle}`}
                        >
                          <span>{opt}</span>
                          {selectedQuizAnswer !== null && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedQuizAnswer !== null && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs font-semibold text-emerald-950 leading-relaxed">
                      {preset.quizExplanation}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Private Group Code Input Bar (No secret codes exposed publicly) */}
          <div className="mt-4 pt-3.5 border-t border-border-subtle">
            <form
              onSubmit={handleJoinCodeSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-text-muted absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="معك كود المجموعة الخاص بك من الأستاذ؟ أدخله هنا..."
                  aria-label="كود الجروب للانضمام السريع"
                  className="w-full ps-9 pe-3 py-2 text-xs font-semibold bg-bg border border-border rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>دخول المجموعة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const primaryBtnClass = getButtonStyleClasses(theme?.buttonStyle, true);
  const secondaryBtnClass = getButtonStyleClasses(theme?.buttonStyle, false);

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
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1.02, opacity: 0.32 }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-full object-cover"
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
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black font-heading tracking-[-0.025em] leading-[1.14] text-balance"
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
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10"
        >
          <motion.h1
            variants={blurUp}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black font-heading text-text-main tracking-[-0.025em] leading-[1.14] text-balance"
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
            <InteractiveLessonStudio
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

  /* ── 3. Split Variant (Default) — Warm Editorial Light Mesh ──────── */
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden border-b border-border-subtle"
      style={{
        background:
          'radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--color-primary) 11%, transparent), transparent 52%), radial-gradient(circle at 86% 82%, color-mix(in srgb, var(--color-secondary) 10%, transparent), transparent 50%), linear-gradient(180deg, #FFFDF9 0%, var(--color-bg) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Text side */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 space-y-6 text-start"
          >
            <motion.div variants={drawLine} className="w-14 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <motion.h1
              variants={blurUp}
              className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black font-heading text-text-main tracking-[-0.025em] leading-[1.16] text-balance"
            >
              {content.title}
            </motion.h1>
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.82] max-w-xl">
              {content.subtitle}
            </motion.p>
            <motion.div variants={fadeUpItem} className="flex flex-wrap items-center gap-4 pt-1">
              {content.primaryButtonText &&
                renderButton(content.primaryButtonText, content.primaryButtonLink || '/register', true)}
              {content.secondaryButtonText &&
                renderButton(content.secondaryButtonText, content.secondaryButtonLink || '/subjects', false)}
            </motion.div>

            {/* Weekly Study System Roadmap for Thanawya Amma Student */}
            <motion.div
              variants={fadeUpItem}
              className="pt-5 border-t border-border-subtle space-y-2.5 max-w-xl"
            >
              <div className="text-xs font-bold text-text-muted">
                نظام الدراسة الأسبوعي مع الأستاذ لضمان التقفيل:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { step: '1', label: 'محاضرة الشرح', sub: 'سبورة ذكية 1080p' },
                  { step: '2', label: 'ملزمة الواجب', sub: 'PDF + كتب خارجية' },
                  { step: '3', label: 'كويز الحصة', sub: 'بابل شيت إجباري' },
                  { step: '4', label: 'متابعة ولي الأمر', sub: 'تقرير درجات أسبوعي' },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-2.5 rounded-xl bg-surface border border-border-subtle space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center tabular-nums shrink-0">
                        {item.step}
                      </span>
                      <span className="text-xs font-bold text-text-main">{item.label}</span>
                    </div>
                    <div className="text-[11px] text-text-muted">{item.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Interactive Lesson Studio side */}
          <motion.div
            variants={slideInFromEnd}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6"
          >
            <InteractiveLessonStudio
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
