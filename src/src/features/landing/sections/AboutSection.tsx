import React from 'react';
import { motion } from 'framer-motion';
import { AboutContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import {
  VIEWPORT_ONCE,
  staggerContainer,
  staggerSlow,
  fadeUpItem,
  blurUp,
  scaleReveal,
  slideInFromStart,
} from './motion';
import { CheckCircle2, GraduationCap } from 'lucide-react';

interface AboutSectionProps {
  content: AboutContent;
  variant: string;
  theme?: LandingTheme;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const features = Array.isArray(content.features) ? content.features : [];

  /* ── 1. Compact Variant ─────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <section className="py-12 sm:py-20 bg-surface border-y border-border-subtle">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6"
        >
          <motion.h2
            variants={blurUp}
            className="text-2xl sm:text-4xl font-bold font-heading text-text-main leading-[1.45]"
          >
            {content.title}
          </motion.h2>
          <motion.p variants={fadeUpItem} className="text-sm sm:text-lg text-text-muted leading-[1.85] max-w-2xl mx-auto">
            {content.bio}
          </motion.p>
          {features.length > 0 && (
            <motion.div
              variants={staggerSlow}
              className="flex flex-wrap items-center justify-center gap-3 pt-4"
            >
              {features.map((feat, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUpItem}
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 bg-bg border border-border hover:border-primary/40 hover:bg-primary-subtle/50 transition-colors text-sm font-semibold text-text-main ${radiusClass}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>
    );
  }

  /* ── 2. Card Variant ────────────────────────────────────────────── */
  if (variant === 'card') {
    return (
      <section className="py-12 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={scaleReveal}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className={`relative overflow-hidden p-5 sm:p-12 bg-surface border border-border shadow-[0_20px_55px_-15px_rgba(15,23,42,0.1)] ${radiusClass} space-y-6 sm:space-y-8`}
          >
            {/* Decorative corner blob */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -end-16 w-56 h-56 rounded-full blur-3xl opacity-20"
              style={{ background: 'var(--color-primary)' }}
            />
            <div className="text-center space-y-3 sm:space-y-4 relative">
              <h2 className="text-2xl sm:text-4xl font-bold font-heading text-text-main leading-[1.45]">
                {content.title}
              </h2>
              <p className="text-sm sm:text-lg text-text-muted leading-[1.85] sm:leading-[1.9] max-w-3xl mx-auto">
                {content.bio}
              </p>
            </div>
            {features.length > 0 && (
              <motion.div
                variants={staggerSlow}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT_ONCE}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border-subtle relative"
              >
                {features.map((feat, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeUpItem}
                    whileHover={{ x: -4, borderColor: 'color-mix(in srgb, var(--color-primary) 40%, transparent)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`flex items-start gap-3.5 p-4 bg-bg border border-border-subtle transition-colors ${radiusClass}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-text-main leading-snug">
                      {feat}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── 3. Split Variant (Default) ─────────────────────────────────── */
  return (
    <section className="py-12 sm:py-24 bg-surface border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            variants={slideInFromStart}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="relative"
            >
              <div
                className={`hidden sm:block absolute -top-4 -end-4 inset-0 bg-primary-subtle border border-primary/15 ${radiusClass}`}
                aria-hidden="true"
              />
              <div
                className={`relative overflow-hidden border border-border shadow-[0_20px_55px_-15px_rgba(15,23,42,0.13)] bg-bg ${radiusClass}`}
              >
                {content.imageUrl ? (
                  <img
                    src={content.imageUrl}
                    alt={content.title}
                    className="w-full h-[260px] sm:h-[460px] object-cover object-[50%_20%]"
                  />
                ) : (
                  <div className="w-full h-[260px] sm:h-[460px] bg-gradient-to-br from-primary-subtle to-bg flex items-center justify-center">
                    <GraduationCap className="w-20 h-20 text-primary/30" />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="lg:col-span-7 order-1 lg:order-2 space-y-5 sm:space-y-6 text-start"
          >
            <motion.h2
              variants={blurUp}
              className="text-2xl sm:text-4xl font-bold font-heading text-text-main leading-[1.45]"
            >
              {content.title}
            </motion.h2>
            <motion.p variants={fadeUpItem} className="text-sm sm:text-lg text-text-muted leading-[1.85] sm:leading-[1.9] max-w-2xl">
              {content.bio}
            </motion.p>
            {features.length > 0 && (
              <motion.div variants={staggerSlow} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                {features.map((feat, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeUpItem}
                    whileHover={{ x: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`flex items-start gap-3 p-3.5 bg-bg border border-border-subtle hover:border-primary/35 transition-colors ${radiusClass}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-text-main leading-snug">{feat}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
