import React from 'react';
import { motion } from 'framer-motion';
import { TestimonialsContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { RtlCarouselAdapter } from '../adapters/RtlCarouselAdapter';
import {
  VIEWPORT_ONCE,
  staggerContainer,
  staggerSlow,
  fadeUpItem,
  blurUp,
} from './motion';
import { Star, Quote } from 'lucide-react';

interface TestimonialsSectionProps {
  content: TestimonialsContent;
  variant: string;
  theme?: LandingTheme;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  content,
  variant,
  theme,
}) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const items = Array.isArray(content.items) ? content.items : [];

  if (items.length === 0) return null;

  const renderStars = (rating = 5) => (
    <div className="flex items-center gap-1 text-amber-500" aria-label={`تقييم ${rating} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'opacity-25'}`} />
      ))}
    </div>
  );

  const renderAuthor = (t: TestimonialsContent['items'][number]) => (
    <div className="flex items-center gap-3.5 pt-4 border-t border-border-subtle">
      {t.avatarUrl ? (
        <img
          src={t.avatarUrl}
          alt={t.name}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/15 shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {t.name.charAt(0)}
        </div>
      )}
      <div>
        <h4 className="font-bold text-text-main text-sm">{t.name}</h4>
        <span className="text-xs text-text-muted">{t.role}</span>
      </div>
    </div>
  );

  return (
    <section className="py-20 sm:py-28 bg-surface border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="text-center max-w-3xl mx-auto mb-14 space-y-3.5"
        >
          <motion.h2 variants={blurUp} className="text-3xl sm:text-4xl font-bold font-heading text-text-main leading-[1.45]">
            {content.title || 'آراء وتجارب طلابنا'}
          </motion.h2>
          {content.subtitle && (
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.85]">
              {content.subtitle}
            </motion.p>
          )}
        </motion.div>

        {/* 1. Quotes Variant */}
        {variant === 'quotes' ? (
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 md:grid-cols-3 gap-7"
          >
            {items.map((t) => (
              <motion.div
                key={t.id}
                variants={fadeUpItem}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className={`p-7 sm:p-8 bg-bg border border-border hover:border-primary/35 transition-colors flex flex-col justify-between text-start space-y-5 ${radiusClass}`}
              >
                <div className="space-y-4">
                  <Quote className="w-8 h-8 text-primary/30" />
                  <p className="text-text-main text-base leading-[1.8]">«{t.text}»</p>
                </div>
                <div className="space-y-4">
                  {renderStars(t.rating)}
                  {renderAuthor(t)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : variant === 'carousel' ? (
          /* 2. Carousel Variant powered by Embla Carousel Adapter */
          <RtlCarouselAdapter radiusClass={radiusClass}>
            {items.map((t) => (
              <div
                key={t.id}
                className={`h-full p-7 bg-bg border border-border hover:border-primary/35 transition-colors flex flex-col justify-between space-y-5 text-start ${radiusClass}`}
              >
                <div className="space-y-3.5">
                  {renderStars(t.rating)}
                  <p className="text-text-main text-sm sm:text-base leading-[1.8]">«{t.text}»</p>
                </div>
                {renderAuthor(t)}
              </div>
            ))}
          </RtlCarouselAdapter>
        ) : (
          /* 3. Grid Variant (Default) */
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
          >
            {items.map((t) => (
              <motion.div
                key={t.id}
                variants={fadeUpItem}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className={`relative p-7 bg-bg border border-border hover:border-primary/35 transition-colors flex flex-col justify-between space-y-6 text-start ${radiusClass}`}
              >
                <Quote
                  className="absolute top-6 end-6 w-8 h-8 text-primary/10 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="space-y-4 relative">
                  {renderStars(t.rating)}
                  <p className="text-text-main text-sm sm:text-base leading-[1.85]">«{t.text}»</p>
                </div>
                {renderAuthor(t)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};
