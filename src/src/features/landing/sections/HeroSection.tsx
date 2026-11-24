import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroContent, LandingTheme } from '../types';
import { tenantPath } from '@/lib/tenant';
import { getRadiusClass, getButtonStyleClasses } from './common';
import { staggerContainer, fadeUpItem, scaleReveal } from './motion';
import { ArrowLeft, BookOpen, GraduationCap, PlayCircle } from 'lucide-react';

interface HeroSectionProps {
  content: HeroContent;
  variant: string;
  theme?: LandingTheme;
}

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

    const btnClass = `group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base cursor-pointer ${
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

  // 1. Full Background Variant
  if (variant === 'fullBackground') {
    return (
      <section className="relative min-h-[560px] sm:min-h-[620px] flex items-center justify-center text-center overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
        {content.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <motion.img
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1.02, opacity: 0.35 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(2,6,23,0.75) 0%, rgba(2,6,23,0.65) 50%, color-mix(in srgb, var(--color-primary) 35%, rgba(2,6,23,0.95)) 100%)',
              }}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 55%), linear-gradient(135deg, #020617 0%, #0f172a 100%)',
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
            variants={fadeUpItem}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black font-heading tracking-[-0.02em] leading-[1.15] text-balance"
          >
            {content.title}
          </motion.h1>
          <motion.p
            variants={fadeUpItem}
            className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-normal"
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

  // 2. Centered Variant
  if (variant === 'centered') {
    return (
      <section
        className="relative py-20 sm:py-28 text-center overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--color-primary) 9%, transparent), transparent 70%)',
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
        >
          <motion.h1
            variants={fadeUpItem}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black font-heading text-text-main tracking-[-0.02em] leading-[1.15] text-balance"
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

          {content.imageUrl && (
            <motion.div variants={scaleReveal} className="pt-8">
              <div
                className={`relative overflow-hidden border border-border/80 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.16)] mx-auto max-w-4xl bg-surface ${radiusClass}`}
              >
                <img
                  src={content.imageUrl}
                  alt={content.title}
                  className="w-full h-[300px] sm:h-[440px] object-cover"
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    );
  }

  // 3. Split Variant (Default)
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 55%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 space-y-7 text-start"
          >
            <motion.h1
              variants={fadeUpItem}
              className="text-4xl sm:text-5xl lg:text-[3.35rem] font-black font-heading text-text-main tracking-[-0.02em] leading-[1.16] text-balance"
            >
              {content.title}
            </motion.h1>
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.8] max-w-xl">
              {content.subtitle}
            </motion.p>
            <motion.div variants={fadeUpItem} className="flex flex-wrap items-center gap-4 pt-1">
              {content.primaryButtonText &&
                renderButton(content.primaryButtonText, content.primaryButtonLink || '/register', true)}
              {content.secondaryButtonText &&
                renderButton(content.secondaryButtonText, content.secondaryButtonLink || '/subjects', false)}
            </motion.div>
          </motion.div>

          <motion.div
            variants={scaleReveal}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6"
          >
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative mx-auto max-w-xl lg:max-w-none"
            >
              <div
                className={`hidden sm:block absolute -bottom-4 -start-4 inset-0 border-2 border-primary/20 bg-primary-subtle/40 ${radiusClass}`}
                aria-hidden="true"
              />
              <div
                className={`relative overflow-hidden border border-border bg-surface shadow-[0_24px_60px_-15px_rgba(15,23,42,0.14)] ${radiusClass}`}
              >
                {content.imageUrl ? (
                  <>
                    <img
                      src={content.imageUrl}
                      alt={content.title}
                      className="w-full h-[340px] sm:h-[440px] object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-[340px] sm:h-[440px] p-8 flex flex-col justify-between bg-gradient-to-br from-primary-subtle/60 via-surface to-bg">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full">
                        بيئة تعليمية متكاملة
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs flex items-center gap-3.5">
                        <PlayCircle className="w-8 h-8 text-primary shrink-0" />
                        <div className="text-start">
                          <div className="text-sm font-bold text-text-main">محاضرات مسجلة ومرتبة</div>
                          <div className="text-xs text-text-muted">شروحات متاحة للمراجعة في أي وقت</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs flex items-center gap-3.5">
                        <BookOpen className="w-8 h-8 text-primary shrink-0" />
                        <div className="text-start">
                          <div className="text-sm font-bold text-text-main">مذكرات وتدريبات دورية</div>
                          <div className="text-xs text-text-muted">متابعة مستمرة لمستوى كل طالب</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
