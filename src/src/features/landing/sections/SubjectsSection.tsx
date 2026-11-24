import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { subjectsApi } from '@/features/subjects/api';
import { SubjectsContent, LandingTheme } from '../types';
import { tenantPath } from '@/lib/tenant';
import { getRadiusClass, getButtonStyleClasses } from './common';
import { RtlCarouselAdapter } from '../adapters/RtlCarouselAdapter';
import {
  VIEWPORT_ONCE,
  staggerContainer,
  staggerFast,
  fadeUpItem,
  slideInFromStart,
  EASE_OUT_EXPO,
} from './motion';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookOpen, Layers, ArrowLeft, ArrowUpLeft, PlayCircle, FileText, CheckCircle2 } from 'lucide-react';

interface SubjectsSectionProps {
  content: SubjectsContent;
  variant: string;
  theme?: LandingTheme;
  previewSubjects?: Array<{
    id: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    lessonsCount?: number;
  }>;
}

/** Editorial Subject Card with Warm Spotlight & Clean Elevation (No 3D Wobble) */
const InteractiveSubjectCard: React.FC<{
  sub: {
    id: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    lessonsCount?: number;
  };
  radiusClass: string;
  primaryBtnClass: string;
}> = ({ sub, radiusClass, primaryBtnClass }) => {
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    setSpotlightPos({ x: relX * 100, y: relY * 100 });
  };

  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative h-full bg-surface border border-border hover:border-primary/40 shadow-[0_14px_34px_-15px_rgba(28,25,23,0.08)] transition-colors duration-300 flex flex-col justify-between overflow-hidden group ${radiusClass}`}
    >
        {/* Dynamic Cursor Spotlight Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(360px circle at ${spotlightPos.x}% ${spotlightPos.y}%, color-mix(in srgb, var(--color-primary) 11%, transparent), transparent 70%)`,
          }}
        />

        {/* Cover Thumbnail */}
        <div className="aspect-[16/10] bg-gradient-to-br from-primary-subtle to-bg flex items-center justify-center relative overflow-hidden">
          {sub.thumbnailUrl ? (
            <>
              <img
                src={sub.thumbnailUrl}
                alt={sub.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
            </>
          ) : (
            <BookOpen className="w-14 h-14 text-primary/35 group-hover:scale-110 transition-transform duration-300" />
          )}

          {/* Lessons Count Badge */}
          <div className="absolute top-3 end-3 px-3 py-1 rounded-full bg-surface/95 text-xs font-bold text-text-main shadow-xs tabular-nums flex items-center gap-1.5">
            <PlayCircle className="w-3.5 h-3.5 text-primary" />
            <span>{sub.lessonsCount !== undefined ? `${sub.lessonsCount} درس` : 'منهج متكامل'}</span>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-20 p-6 flex-1 flex flex-col justify-between space-y-5 text-start">
          <div className="space-y-3">
            <h3 className="text-xl font-bold font-heading text-text-main group-hover:text-primary transition-colors">
              {sub.title}
            </h3>
            <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
              {sub.description ||
                'مادة دراسية متكاملة تشتمل على أحدث الفيديوهات والشروحات والاختبارات.'}
            </p>

            {/* Included Learning Assets */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg">
                <PlayCircle className="w-3.5 h-3.5 text-primary" />
                <span>فيديو HD</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>ملفات PDF</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>تدريبات</span>
              </span>
            </div>
          </div>

          <Link
            to={tenantPath(`/subjects/${sub.id}`)}
            className={`w-full py-3 text-center text-sm flex items-center justify-center gap-2 ${primaryBtnClass} ${radiusClass}`}
          >
            <span>استكشف المادة والدروس</span>
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        </div>
    </motion.div>
  );
};

export const SubjectsSection: React.FC<SubjectsSectionProps> = ({
  content,
  variant,
  theme,
  previewSubjects,
}) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const primaryBtnClass = getButtonStyleClasses(theme?.buttonStyle, true);
  const secondaryBtnClass = getButtonStyleClasses(theme?.buttonStyle, false);

  const { data: fetchedSubjects, isLoading } = useQuery({
    queryKey: ['subjects', 'published'],
    queryFn: () => subjectsApi.getPublishedSubjects(),
    enabled: !previewSubjects,
    staleTime: 1000 * 60 * 3,
  });

  const rawSubjects = previewSubjects || fetchedSubjects || [];
  const limit = content.showCount || 6;
  const subjects = rawSubjects.slice(0, limit);

  return (
    <section id="subjects-section" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div className="space-y-3 text-start max-w-2xl">
            <motion.div variants={fadeUpItem} className="w-12 h-1 rounded-full bg-primary" aria-hidden="true" />
            <motion.h2
              variants={fadeUpItem}
              className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em]"
            >
              {content.title || 'المواد الدراسية المتاحة'}
            </motion.h2>
            {content.subtitle && (
              <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-relaxed">
                {content.subtitle}
              </motion.p>
            )}
          </div>
          <motion.div variants={fadeUpItem}>
            <Link
              to={tenantPath('/subjects')}
              className={`group inline-flex items-center gap-2 px-5 py-2.5 text-sm shrink-0 ${secondaryBtnClass} ${radiusClass}`}
            >
              <span>عرض جميع المواد</span>
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Content Area */}
        {isLoading && !previewSubjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`p-5 border border-border bg-surface ${radiusClass} space-y-4`}>
                <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className={`p-12 text-center bg-surface border border-border/80 ${radiusClass} max-w-lg mx-auto space-y-4`}
          >
            <div className="w-16 h-16 rounded-full bg-primary-subtle text-primary mx-auto flex items-center justify-center">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-text-main">لا توجد مواد منشورة حالياً</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              سيتم نشر المواد الدراسية والمناهج التفاعلية قريباً من قبل المعلم.
            </p>
          </motion.div>
        ) : variant === 'list' ? (
          /* ── List Variant ─────────────────────────────────────────── */
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="space-y-4"
          >
            {subjects.map((sub, idx) => (
              <motion.div
                key={sub.id}
                variants={slideInFromStart}
                custom={idx}
                whileHover={{ x: -4 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <Link
                  to={tenantPath(`/subjects/${sub.id}`)}
                  className={`group p-5 bg-surface border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${radiusClass}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary-subtle border border-primary/15 overflow-hidden flex items-center justify-center text-primary shrink-0">
                      {sub.thumbnailUrl ? (
                        <img
                          src={sub.thumbnailUrl}
                          alt={sub.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-7 h-7" />
                      )}
                    </div>
                    <div className="text-start">
                      <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                        {sub.title}
                      </h3>
                      {sub.description && (
                        <p className="text-xs sm:text-sm text-text-muted line-clamp-1 mt-1">
                          {sub.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary bg-primary-subtle group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 ${radiusClass}`}
                  >
                    <span>استكشف المادة</span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : variant === 'carousel' ? (
          /* ── Carousel Variant powered by Embla Carousel Adapter ──── */
          <RtlCarouselAdapter radiusClass={radiusClass} slideClassName="min-w-[290px] sm:min-w-[350px] max-w-[350px]">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className={`h-full bg-surface shadow-[0_18px_40px_-15px_rgba(15,23,42,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden group ${radiusClass}`}
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-primary-subtle to-bg flex items-center justify-center relative overflow-hidden">
                  {sub.thumbnailUrl ? (
                    <>
                      <img
                        src={sub.thumbnailUrl}
                        alt={sub.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <BookOpen className="w-12 h-12 text-primary/35" />
                  )}
                  {sub.lessonsCount !== undefined && (
                    <div className="absolute top-3 end-3 px-3 py-1 rounded-full bg-surface/95 text-xs font-bold text-text-main shadow-xs tabular-nums">
                      {sub.lessonsCount} درس
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5 text-start">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-text-main line-clamp-1 group-hover:text-primary transition-colors">
                      {sub.title}
                    </h3>
                    <p className="text-sm text-text-muted line-clamp-2 mt-2 leading-relaxed">
                      {sub.description || 'مادة دراسية تفاعلية تشمل شروحات وتدريبات شاملة.'}
                    </p>
                  </div>
                  <Link
                    to={tenantPath(`/subjects/${sub.id}`)}
                    className={`w-full py-2.5 text-center text-sm inline-flex items-center justify-center gap-2 ${primaryBtnClass} ${radiusClass}`}
                  >
                    <span>استكشف المادة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </RtlCarouselAdapter>
        ) : (
          /* ── Grid Variant (Default) with 3D Spring Tilt & Spotlight ─ */
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
          >
            {subjects.map((sub) => (
              <InteractiveSubjectCard
                key={sub.id}
                sub={sub}
                radiusClass={radiusClass}
                primaryBtnClass={primaryBtnClass}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};
