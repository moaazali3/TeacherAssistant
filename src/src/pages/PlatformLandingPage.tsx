import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { platformPath, buildTenantFullUrl } from '@/lib/tenant';
import {
  staggerContainer,
  staggerFast,
  fadeUpItem,
  blurUp,
  slideInFromEnd,
  drawLine,
  VIEWPORT_ONCE,
  EASE_OUT_EXPO,
} from '@/features/landing/sections/motion';
import {
  Sparkles,
  Palette,
  Globe,
  ShieldCheck,
  ArrowLeft,
  Play,
  Layers,
  Users,
  FileText,
  Sliders,
  FlaskConical,
  Atom,
  BookOpen,
  Dna,
  Sigma,
  GraduationCap,
  Award,
  Video,
} from 'lucide-react';

interface TeacherShowcaseItem {
  id: string;
  name: string;
  platformTitle: string;
  title: string;
  subject: string;
  slug: string;
  color: string;
  portraitUrl: string;
  studentsCount: string;
  lecturesCount: string;
  experienceYears: string;
  quote: string;
  icon: React.ReactNode;
}

const TEACHER_SHOWCASE_PLATFORMS: TeacherShowcaseItem[] = [
  {
    id: 'chem',
    name: 'أ. طارق المنشاوي',
    platformTitle: 'منصة الأستاذ طارق المنشاوي',
    title: 'خبير الكيمياء للثانوية العامة والأزهرية',
    subject: 'الكيمياء العضوية والكهربية',
    slug: 'demo',
    color: '#3730A3',
    portraitUrl: '/images/teachers/teacher-chem.jpg',
    studentsCount: '+14,200 طالب',
    lecturesCount: '48 محاضرة ومذكرة',
    experienceYears: '16 سنة خبرة',
    quote:
      'منصتي الخاصة على طرابيزة وفرت لطلابي متابعة أسبوعية منظمة لكل باب، من شرح المعادلات وحتى كويزات البابل شيت.',
    icon: <FlaskConical className="w-5 h-5" />,
  },
  {
    id: 'phy',
    name: 'أ. حسام الدين رأفت',
    platformTitle: 'منصة الأستاذ حسام الدين رأفت',
    title: 'أستاذ الفيزياء الكهربية والحديثة للثانوية العامة',
    subject: 'الفيزياء الكهربية والحديثة',
    slug: 'physics',
    color: '#7C3AED',
    portraitUrl: '/images/teachers/teacher-physics.jpg',
    studentsCount: '+18,500 طالب',
    lecturesCount: '56 محاضرة ومذكرة',
    experienceYears: '14 سنة خبرة',
    quote:
      'الطلاب بيدخلوا على نطاقي المستقل يلاقوا محاضرات كيرشوف والفيزياء الحديثة مرتبة مع ملازم الحل بدون أي تشتيت.',
    icon: <Atom className="w-5 h-5" />,
  },
  {
    id: 'bio',
    name: 'أ. سلمى عبدالحميد',
    platformTitle: 'منصة الأستاذة سلمى عبدالحميد',
    title: 'أستاذة الأحياء والجيولوجيا للثانوية العامة',
    subject: 'الأحياء والجيولوجيا',
    slug: 'bio',
    color: '#16A34A',
    portraitUrl: '/images/teachers/teacher-bio.jpg',
    studentsCount: '+16,400 طالب',
    lecturesCount: '52 محاضرة ومذكرة',
    experienceYears: '13 سنة خبرة',
    quote:
      'رفع ملازم الرسوم التوضيحية مع فيديوهات شرح الدعامة والحركة والـ DNA في مكان واحد سهّل المراجعة النهائية جداً.',
    icon: <Dna className="w-5 h-5" />,
  },
  {
    id: 'arb',
    name: 'أ. عبدالرحمن السوهاجي',
    platformTitle: 'منصة الأستاذ عبدالرحمن السوهاجي',
    title: 'أستاذ اللغة العربية والنحو والبلاغة للثانوية العامة',
    subject: 'اللغة العربية وآدابها',
    slug: 'arabic',
    color: '#059669',
    portraitUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&q=85',
    studentsCount: '+21,000 طالب',
    lecturesCount: '64 محاضرة ومذكرة',
    experienceYears: '19 سنة خبرة',
    quote:
      'تخصيص ألوان المنصة وترتيب فروع النحو والبلاغة والأدب والنصوص المتحررة خلّى تجربة الطالب سهلة وواضحة من أول يوم.',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: 'math',
    name: 'أ. محمود الشافعي',
    platformTitle: 'منصة الأستاذ محمود الشافعي',
    title: 'أستاذ الرياضيات البحتة والتطبيقية للثانوية العامة',
    subject: 'التفاضل والجبر والإحصاء',
    slug: 'maths',
    color: '#1D4ED8',
    portraitUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
    studentsCount: '+15,800 طالب',
    lecturesCount: '60 محاضرة ومذكرة',
    experienceYears: '15 سنة خبرة',
    quote:
      'تقسيم مجموعات علمي رياضة بين التفاضل والجبر والإحصاء مع متابعة حضور كل طالب وفر على السكرتارية مجهود شهور.',
    icon: <Sigma className="w-5 h-5" />,
  },
];

/** Editorial Teacher Portrait & Live Demo Showcase (Full uncropped portrait & full names) */
const EditorialTeacherShowcase: React.FC = () => {
  const [activeTeacher, setActiveTeacher] = useState<TeacherShowcaseItem>(
    TEACHER_SHOWCASE_PLATFORMS[0]
  );

  return (
    <div className="space-y-4">
      {/* Main Visual Portrait Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTeacher.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="relative rounded-3xl overflow-hidden bg-surface border border-border shadow-[0_24px_60px_-15px_rgba(28,25,23,0.14)]"
        >
          {/* Portrait Image Container — Tall 420px frame with object-[50%_22%] so full head & torso show clearly */}
          <div className="relative h-[390px] sm:h-[440px] w-full overflow-hidden bg-surface-subtle">
            <img
              src={activeTeacher.portraitUrl}
              alt={activeTeacher.name}
              className="w-full h-full object-cover object-[50%_22%]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(28,25,23,0.02) 0%, rgba(28,25,23,0.18) 55%, rgba(28,25,23,0.92) 100%)',
              }}
            />

            {/* Subject Icon Badge */}
            <div
              className="absolute top-4 start-4 px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md"
              style={{ backgroundColor: activeTeacher.color }}
            >
              {activeTeacher.icon}
              <span>{activeTeacher.subject}</span>
            </div>

            {/* Experience Pill */}
            <div className="absolute top-4 end-4 px-3 py-1.5 rounded-xl bg-surface/95 text-text-main text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Award className="w-3.5 h-3.5 text-secondary" />
              <span>{activeTeacher.experienceYears}</span>
            </div>

            {/* Bottom Teacher Identity Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 text-white space-y-1.5 text-start">
              <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
                {activeTeacher.platformTitle}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                {activeTeacher.title}
              </p>
            </div>
          </div>

          {/* Card Footer Details & Direct "Try Demo Now" CTA */}
          <div className="p-6 bg-surface space-y-5 text-start">
            <p className="text-sm text-text-muted leading-relaxed">
              «{activeTeacher.quote}»
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-xs font-bold text-text-main">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: activeTeacher.color }}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-text-muted text-[11px]">الطلاب</div>
                    <div className="tabular-nums">{activeTeacher.studentsCount}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-text-main">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: activeTeacher.color }}
                  >
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-text-muted text-[11px]">المحتوى</div>
                    <div className="tabular-nums">{activeTeacher.lecturesCount}</div>
                  </div>
                </div>
              </div>

              <a
                href={buildTenantFullUrl(activeTeacher.slug, '/')}
                className="px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all inline-flex items-center gap-2"
                style={{ backgroundColor: activeTeacher.color }}
              >
                <span>جرّب الديمو الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Teacher Portrait Selector Strip — Wrapping pills showing full teacher names without truncation */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {TEACHER_SHOWCASE_PLATFORMS.map((t) => {
          const isSelected = t.id === activeTeacher.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTeacher(t)}
              className={`group px-3 py-2 rounded-2xl border text-start transition-all cursor-pointer inline-flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-surface border-primary shadow-sm ring-2 ring-primary/15'
                  : 'bg-surface/75 border-border hover:bg-surface'
              }`}
            >
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-border-subtle">
                <img
                  src={t.portraitUrl}
                  alt={t.name}
                  className="w-full h-full object-cover object-[50%_20%]"
                />
              </div>
              <div className="pe-1">
                <div className="text-xs font-black text-text-main whitespace-nowrap">
                  {t.name}
                </div>
                <div className="text-[10px] font-semibold text-text-muted whitespace-nowrap">
                  {t.subject}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PlatformLandingPage: React.FC = () => {
  return (
    <div className="space-y-24 pb-20 text-start overflow-hidden">
      {/* ── 1. Hero Section — Editorial Split with Real Teacher Portrait Showcase ── */}
      <section
        className="relative py-14 sm:py-22 border-b border-border-subtle"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 52%), radial-gradient(circle at 85% 80%, color-mix(in srgb, var(--color-secondary) 11%, transparent), transparent 50%), linear-gradient(180deg, #FFFDF9 0%, var(--color-bg) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Right Column: Editorial Copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="lg:col-span-6 space-y-6 text-start"
            >
              <motion.div
                variants={drawLine}
                className="w-14 h-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />

              <motion.h1
                variants={blurUp}
                className="text-4xl sm:text-5xl lg:text-[3.35rem] font-black text-text-main font-heading tracking-[-0.025em] leading-[1.15] text-balance"
              >
                طرابيزة.. اصنع منصتك التعليمية المستقلة باسمك وهويتك الكاملة
              </motion.h1>

              <motion.p
                variants={fadeUpItem}
                className="text-base sm:text-lg text-text-muted leading-[1.85] max-w-xl"
              >
                منصة سحابية متكاملة مصممة لأساتذة الثانوية العامة والأكاديميات التعليمية. أطلق موقعك الخاص بصورتك وألوانك، وارفع محاضراتك وملازمك، وأدر مجموعات طلابك بخصوصية تامة.
              </motion.p>

              {/* Direct Clear CTAs: Create Platform & Try Live Demo */}
              <motion.div
                variants={fadeUpItem}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link to={platformPath('/register')}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="font-bold shadow-sm px-7"
                    startIcon={<Sparkles className="w-5 h-5" />}
                    endIcon={<ArrowLeft className="w-5 h-5" />}
                  >
                    اصنع منصتك الآن
                  </Button>
                </Link>
                <a href={buildTenantFullUrl('demo', '/')}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-bold px-6"
                    startIcon={<Play className="w-4 h-4 text-primary" />}
                  >
                    جرّب الديمو الآن
                  </Button>
                </a>
              </motion.div>

              {/* Visual Subject Icons & Highlights Strip */}
              <motion.div
                variants={fadeUpItem}
                className="pt-6 border-t border-border-subtle grid grid-cols-3 gap-4 max-w-lg"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-text-main">هوية خاصة</div>
                    <div className="text-xs text-text-muted">باسم وصورة الأستاذ</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-text-main">24 تصميماً</div>
                    <div className="text-xs text-text-muted">قابلة للتخصيص الفوري</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-text-main">عزل كامل</div>
                    <div className="text-xs text-text-muted">لمجموعات وطلاب كل معلم</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Left Column: Real Teacher Portrait Showcase */}
            <motion.div
              variants={slideInFromEnd}
              initial="hidden"
              animate="visible"
              className="lg:col-span-6"
            >
              <EditorialTeacherShowcase />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Live Demo Teacher Platforms Gallery (With Real Portraits & Icons) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-3 max-w-2xl">
            <motion.div
              variants={drawLine}
              className="w-12 h-1 rounded-full bg-secondary"
              aria-hidden="true"
            />
            <motion.h2
              variants={blurUp}
              className="text-3xl sm:text-4xl font-black text-text-main font-heading tracking-[-0.02em]"
            >
              جرّب نماذج منصات الأساتذة الحية الآن
            </motion.h2>
            <motion.p variants={fadeUpItem} className="text-text-muted text-base leading-relaxed">
              تصفح منصات الأساتذة المتكاملة في الكيمياء والفيزياء واللغة العربية والأحياء والرياضيات، وشاهد كيف يرى الطالب محاضراته وملازمه واختباراته.
            </motion.p>
          </div>
          <motion.div variants={fadeUpItem}>
            <Link to={platformPath('/teacher/login')}>
              <Button variant="outline" size="md" className="font-bold">
                دخول لوحة تحكم المعلم
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
        >
          {TEACHER_SHOWCASE_PLATFORMS.map((item) => (
            <motion.a
              key={item.slug}
              variants={fadeUpItem}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              href={buildTenantFullUrl(item.slug, '/')}
              className="group rounded-2xl bg-surface border border-border hover:border-primary/40 shadow-[0_14px_34px_-15px_rgba(28,25,23,0.08)] overflow-hidden transition-all flex flex-col justify-between text-start"
            >
              {/* Teacher Photo Banner — Taller h-56 with object-[50%_20%] so full head & shoulders show */}
              <div className="relative h-56 w-full overflow-hidden bg-surface-subtle">
                <img
                  src={item.portraitUrl}
                  alt={item.name}
                  className="w-full h-full object-cover object-[50%_20%] group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 45%, rgba(28,25,23,0.82) 100%)',
                  }}
                />
                <div
                  className="absolute top-3 start-3 w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </div>
                <div className="absolute bottom-3 inset-x-3 text-white space-y-0.5">
                  <div className="text-[11px] font-semibold text-white/85">{item.subject}</div>
                  <h3 className="font-black text-sm sm:text-base leading-snug">{item.name}</h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs text-text-muted font-semibold">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" style={{ color: item.color }} />
                    <span>{item.studentsCount}</span>
                  </span>
                  <span>{item.lecturesCount}</span>
                </div>

                <div
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-opacity group-hover:opacity-95 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: item.color }}
                >
                  <span>جرّب الديمو الآن</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* ── 3. How Tarabeza Works (3-Step Teacher Journey) ─────────────── */}
      <section
        id="how-it-works"
        className="py-20 border-y border-border"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 6%, #FFFDF9) 0%, color-mix(in srgb, var(--color-secondary) 5%, #F3EDE2) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="text-center max-w-3xl mx-auto mb-14 space-y-3"
          >
            <motion.div
              variants={drawLine}
              className="w-10 h-1 rounded-full bg-primary mx-auto"
              aria-hidden="true"
            />
            <motion.h2
              variants={blurUp}
              className="text-3xl sm:text-4xl font-black text-text-main font-heading tracking-[-0.02em]"
            >
              كيف تصنع منصتك على «طرابيزة» في 3 خطوات؟
            </motion.h2>
            <motion.p variants={fadeUpItem} className="text-text-muted text-base">
              بدون أي خبرة برمجية أو تكاليف استضافة معقدة — كل شيء جاهز لتبدأ الشرح فوراً.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 md:grid-cols-3 gap-7"
          >
            {[
              {
                icon: <GraduationCap className="w-6 h-6 text-primary" />,
                title: 'سجّل حسابك واختر هويتك البصرية',
                desc: 'أنشئ حساب المعلم، وارفع صورتك أو شعار أكاديميتك، واختر ألوان منصتك والخط العربي المناسب لطلابك.',
              },
              {
                icon: <Sliders className="w-6 h-6 text-primary" />,
                title: 'صمّم واجهتك وارفع أبواب المنهج',
                desc: 'رتّب أقسام موقعك بالسحب والإفلات من بين 8 أقسام و24 تصميماً، ثم أضف المواد، محاضرات الفيديو، وملازم الـ PDF.',
              },
              {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: 'استقبل طلابك وأدر مجموعاتك بخصوصية',
                desc: 'قسّم طلابك إلى مجموعات دراسية منظمة بمواعيدها، وامنح طلابك صلاحية الوصول للمحاضرات والملازم بسهولة وأمان.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUpItem}
                whileHover={{ y: -5 }}
                className="p-7 rounded-2xl bg-surface border border-border shadow-[0_16px_40px_-15px_rgba(28,25,23,0.08)] space-y-4 text-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-subtle border border-primary/15 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black font-heading text-text-main">{item.title}</h3>
                <p className="text-sm text-text-muted leading-[1.8]">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. Architectural Features Grid ─────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="text-center max-w-3xl mx-auto mb-14 space-y-3"
        >
          <motion.div
            variants={drawLine}
            className="w-10 h-1 rounded-full bg-primary mx-auto"
            aria-hidden="true"
          />
          <motion.h2
            variants={blurUp}
            className="text-3xl sm:text-4xl font-black text-text-main font-heading tracking-[-0.02em]"
          >
            كل ما يحتاجه المعلم العصري في مكان واحد
          </motion.h2>
          <motion.p variants={fadeUpItem} className="text-text-muted text-base">
            بنية سحابية متعددة المستأجرين (Multi-Tenant SaaS) تمنح كل أستاذ استقلالاً كاملاً.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: <Palette className="w-5 h-5 text-primary" />,
              title: 'محرر صفحات هبوط حي (Live Builder)',
              desc: 'تحكم كامل في 8 أقسام رئيسية (Hero, About, Stats, Subjects, Testimonials, FAQ, Contact, Footer) مع معاينة لحظية.',
            },
            {
              icon: <Users className="w-5 h-5 text-primary" />,
              title: 'إدارة ذكية للمجموعات والطلاب',
              desc: 'أنشئ مجموعاتك الدراسية بمواعيدها، وتحكم في فتح أو إغلاق الانضمام لكل مجموعة مع متابعة قائمة الطلاب المسجلين.',
            },
            {
              icon: <FileText className="w-5 h-5 text-primary" />,
              title: 'تنوع المحتوى الدراسي لكل حصة',
              desc: 'يدعم محاضرات الفيديو، ملازم ومذكرات الـ PDF، ملفات الـ Word، المقالات الشارحة، والروابط التفاعلية.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-primary" />,
              title: 'عزل تام لبيانات كل معلم وطلابه',
              desc: 'لا توجد منصة مشتركة تشتت الطالب باسم مدرس آخر؛ الطالب داخل موقع أستاذه فقط ولا يرى سوى مواده ومجموعاته.',
            },
            {
              icon: <Globe className="w-5 h-5 text-primary" />,
              title: 'موقع مستقل خاص بكل أستاذ',
              desc: 'يحصل كل معلم على رابطه المستقل ولوحة تحكم خاصة لإدارة محتواه وهويته البصرية بمرونة كاملة.',
            },
            {
              icon: <Layers className="w-5 h-5 text-primary" />,
              title: 'هوية ورقية نهارية مريحة للمذاكرة',
              desc: 'تصميم Warm Alabaster Paper يتكيف تلقائياً مع اللون الأساسي لكل أستاذ ليمنح طلابك تجربة مذاكرة مريحة لساعات طويلة.',
            },
          ].map((feat, i) => (
            <motion.div
              key={i}
              variants={fadeUpItem}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-colors space-y-3.5 text-start"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-subtle border border-primary/15 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold font-heading text-text-main">{feat.title}</h3>
              <p className="text-sm text-text-muted leading-[1.8]">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── 5. Bottom Editorial Call to Action ─────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          className="relative rounded-3xl p-8 sm:p-14 border border-border overflow-hidden text-center space-y-6 shadow-[0_24px_60px_-18px_rgba(28,25,23,0.12)]"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 55%), linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, #FFFDF9) 0%, #FAF7F2 100%)',
          }}
        >
          <img
            src="/logo.svg"
            alt="طرابيزة"
            className="w-14 h-14 rounded-2xl mx-auto shadow-sm"
          />
          <h2 className="text-3xl sm:text-4xl font-black text-text-main font-heading tracking-[-0.02em] max-w-2xl mx-auto">
            جاهز لإطلاق منصتك التعليمية الخاصة على «طرابيزة»؟
          </h2>
          <p className="text-text-muted max-w-xl mx-auto text-base leading-relaxed">
            سجّل حسابك الآن مجاناً، واصنع منصتك التعليمية المستقلة أو جرّب الديمو الحي لترى المنصة بعين الطالب.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to={platformPath('/register')} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold px-8"
                startIcon={<Sparkles className="w-5 h-5" />}
                endIcon={<ArrowLeft className="w-5 h-5" />}
              >
                اصنع منصتك الآن
              </Button>
            </Link>
            <a href={buildTenantFullUrl('demo', '/')} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-bold px-7"
                startIcon={<Play className="w-4 h-4 text-primary" />}
              >
                جرّب الديمو الآن
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
