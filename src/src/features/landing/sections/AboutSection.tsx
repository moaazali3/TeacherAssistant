import React from 'react';
import { motion } from 'framer-motion';
import { AboutContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { VIEWPORT_ONCE, staggerContainer, fadeUpItem, scaleReveal } from './motion';
import { CheckCircle2, GraduationCap } from 'lucide-react';

interface AboutSectionProps {
  content: AboutContent;
  variant: string;
  theme?: LandingTheme;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const features = Array.isArray(content.features) ? content.features : [];

  // 1. Compact Variant
  if (variant === 'compact') {
    return (
      <section className="py-16 sm:py-20 bg-surface border-y border-border-subtle">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6"
        >
          <motion.div variants={fadeUpItem} className="w-10 h-1 rounded-full bg-primary mx-auto" aria-hidden="true" />
          <motion.h2
            variants={fadeUpItem}
            className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em]"
          >
            {content.title}
          </motion.h2>
          <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.85] max-w-2xl mx-auto">
            {content.bio}
          </motion.p>
          {features.length > 0 && (
            <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 bg-bg border border-border text-sm font-semibold text-text-main ${radiusClass}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>
    );
  }

  // 2. Card Variant
  if (variant === 'card') {
    return (
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={scaleReveal}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className={`relative overflow-hidden p-8 sm:p-14 bg-surface border border-border shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] ${radiusClass} space-y-8`}
          >
            <div className="text-center space-y-4">
              <div className="w-10 h-1 rounded-full bg-primary mx-auto" aria-hidden="true" />
              <h2 className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em]">
                {content.title}
              </h2>
              <p className="text-base sm:text-lg text-text-muted leading-[1.85] max-w-3xl mx-auto">
                {content.bio}
              </p>
            </div>
            {features.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border-subtle">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3.5 p-4 bg-bg border border-border-subtle hover:border-primary/30 transition-colors ${radiusClass}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-text-main leading-snug">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    );
  }

  // 3. Split Variant (Default)
  return (
    <section className="py-20 sm:py-28 bg-surface border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            variants={scaleReveal}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <div className="relative">
              <div
                className={`hidden sm:block absolute -top-4 -end-4 inset-0 bg-primary-subtle border border-primary/15 ${radiusClass}`}
                aria-hidden="true"
              />
              <div
                className={`relative overflow-hidden border border-border shadow-[0_20px_50px_-15px_rgba(15,23,42,0.12)] bg-bg ${radiusClass}`}
              >
                {content.imageUrl ? (
                  <img
                    src={content.imageUrl}
                    alt={content.title}
                    className="w-full h-[360px] sm:h-[440px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[360px] sm:h-[440px] bg-gradient-to-br from-primary-subtle to-bg flex items-center justify-center">
                    <GraduationCap className="w-20 h-20 text-primary/30" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-start"
          >
            <motion.div variants={fadeUpItem} className="w-12 h-1 rounded-full bg-primary" aria-hidden="true" />
            <motion.h2
              variants={fadeUpItem}
              className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em] leading-[1.2]"
            >
              {content.title}
            </motion.h2>
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.85] max-w-2xl">
              {content.bio}
            </motion.p>
            {features.length > 0 && (
              <motion.div variants={fadeUpItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3.5 bg-bg border border-border-subtle ${radiusClass}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-text-main leading-snug">{feat}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
