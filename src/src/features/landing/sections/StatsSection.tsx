import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate, useReducedMotion } from 'framer-motion';
import { StatsContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { VIEWPORT_ONCE, staggerContainer, staggerFast, fadeUpItem, zoomIn, drawLine, EASE_OUT_EXPO } from './motion';
import { Users, Award, TrendingUp, Clock, BookOpen, Star } from 'lucide-react';

interface StatsSectionProps {
  content: StatsContent;
  variant: string;
  theme?: LandingTheme;
}

const AnimatedStatValue: React.FC<{ value: string }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [display, setDisplay] = useState(value);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (!isInView || shouldReduce) {
      setDisplay(value);
      return;
    }
    const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
    if (!match) { setDisplay(value); return; }

    const [, prefix, numStr, suffix] = match;
    const hasComma = numStr.includes(',');
    const target = parseInt(numStr.replace(/,/g, ''), 10);
    if (Number.isNaN(target) || target === 0) { setDisplay(value); return; }

    const controls = animate(0, target, {
      duration: 1.3,
      ease: EASE_OUT_EXPO,
      onUpdate(latest) {
        const rounded = Math.round(latest);
        const formatted = hasComma ? rounded.toLocaleString('en-US') : String(rounded);
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [isInView, value, shouldReduce]);

  return <span ref={ref}>{display}</span>;
};

function renderStatIcon(iconName?: string, className = 'w-5 h-5 text-primary') {
  switch (iconName?.toLowerCase()) {
    case 'award': return <Award className={className} />;
    case 'trending-up':
    case 'trendingup': return <TrendingUp className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'book':
    case 'bookopen': return <BookOpen className={className} />;
    case 'star': return <Star className={className} />;
    case 'users':
    default: return <Users className={className} />;
  }
}

export const StatsSection: React.FC<StatsSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const items = Array.isArray(content.items) ? content.items : [];

  if (items.length === 0) return null;

  /* ── 1. Inline Variant ──────────────────────────────────────────── */
  if (variant === 'inline') {
    return (
      <section className="py-10 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {content.title && (
            <h2 className="text-center text-base font-bold text-text-muted mb-6">{content.title}</h2>
          )}
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border text-center"
          >
            {items.map((stat, idx) => (
              <motion.div key={idx} variants={fadeUpItem} className="p-4 sm:p-6 space-y-1.5">
                <div className="text-3xl sm:text-4xl font-black font-heading text-primary tabular-nums tracking-tight">
                  <AnimatedStatValue value={stat.value} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── 2. Cards Variant ───────────────────────────────────────────── */
  if (variant === 'cards') {
    return (
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {content.title && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="text-center max-w-2xl mx-auto mb-12 space-y-3"
            >
              <motion.div variants={drawLine} className="w-10 h-1 rounded-full bg-primary mx-auto" aria-hidden="true" />
              <motion.h2
                variants={fadeUpItem}
                className="text-2xl sm:text-3xl font-black font-heading text-text-main tracking-[-0.02em]"
              >
                {content.title}
              </motion.h2>
            </motion.div>
          )}
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {items.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={zoomIn}
                whileHover={{ y: -6, boxShadow: '0 20px 45px -15px rgba(15,23,42,0.14)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`p-7 bg-surface border border-border hover:border-primary/40 transition-colors flex flex-col items-start text-start space-y-4 ${radiusClass}`}
              >
                <div className="relative w-11 h-11">
                  <div className="absolute inset-0 rounded-xl bg-primary-subtle border border-primary/15 flex items-center justify-center">
                    {renderStatIcon(stat.icon)}
                  </div>
                  {/* Ping ring */}
                  <motion.span
                    className="absolute inset-0 rounded-xl border border-primary/30"
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: idx * 0.3 }}
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black font-heading text-text-main tabular-nums tracking-tight">
                    <AnimatedStatValue value={stat.value} />
                  </div>
                  <div className="text-sm font-semibold text-text-muted">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── 3. Grid Variant (Default) — Warm Editorial Architectural Band ── */
  return (
    <section
      className="py-16 sm:py-20 relative overflow-hidden border-y border-border"
      style={{
        background:
          'radial-gradient(circle at 85% 20%, color-mix(in srgb, var(--color-secondary) 14%, transparent), transparent 55%), linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, #FFFDF9) 0%, color-mix(in srgb, var(--color-primary) 5%, #F3EDE2) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {content.title && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="text-center max-w-2xl mx-auto mb-12 space-y-3"
          >
            <div className="w-10 h-1 rounded-full bg-secondary mx-auto" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-[-0.02em] text-text-main">
              {content.title}
            </h2>
          </motion.div>
        )}
        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center"
        >
          {items.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={zoomIn}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={`p-6 bg-surface border border-border shadow-[0_14px_34px_-15px_rgba(28,25,23,0.08)] space-y-2.5 ${radiusClass}`}
            >
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-primary-subtle border border-primary/15 flex items-center justify-center">
                  {renderStatIcon(stat.icon, 'w-5 h-5 text-primary')}
                </div>
                <motion.span
                  className="absolute inset-0 rounded-2xl border border-primary/25"
                  animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: idx * 0.4 }}
                  aria-hidden="true"
                />
              </div>
              <div className="text-3xl sm:text-5xl font-black font-heading tracking-tight tabular-nums text-primary">
                <AnimatedStatValue value={stat.value} />
              </div>
              <div className="text-xs sm:text-sm font-bold text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
