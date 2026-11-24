import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { StatsContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { VIEWPORT_ONCE, staggerContainer, fadeUpItem } from './motion';
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

  useEffect(() => {
    if (!isInView) return;
    // Extract first numeric sequence (e.g. "+1,200" -> prefix "+", num 1200, suffix "")
    const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }

    const [, prefix, numStr, suffix] = match;
    const hasComma = numStr.includes(',');
    const target = parseInt(numStr.replace(/,/g, ''), 10);
    if (Number.isNaN(target) || target === 0) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        const rounded = Math.round(latest);
        const formatted = hasComma ? rounded.toLocaleString('en-US') : String(rounded);
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });

    return () => controls.stop();
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
};

function renderStatIcon(iconName?: string, className = 'w-5 h-5 text-primary') {
  switch (iconName?.toLowerCase()) {
    case 'award':
      return <Award className={className} />;
    case 'trending-up':
    case 'trendingup':
      return <TrendingUp className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'book':
    case 'bookopen':
      return <BookOpen className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'users':
    default:
      return <Users className={className} />;
  }
}

export const StatsSection: React.FC<StatsSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const items = Array.isArray(content.items) ? content.items : [];

  if (items.length === 0) return null;

  // 1. Inline Variant
  if (variant === 'inline') {
    return (
      <section className="py-10 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {content.title && (
            <h2 className="text-center text-base font-bold text-text-muted mb-6">
              {content.title}
            </h2>
          )}
          <motion.div
            variants={staggerContainer}
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
                <div className="text-xs sm:text-sm font-semibold text-text-muted">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  // 2. Cards Variant
  if (variant === 'cards') {
    return (
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {content.title && (
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-text-main tracking-[-0.02em]">
                {content.title}
              </h2>
            </div>
          )}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {items.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={fadeUpItem}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className={`p-7 bg-surface border border-border hover:border-primary/40 hover:shadow-md transition-colors flex flex-col items-start text-start space-y-4 ${radiusClass}`}
              >
                <div className="w-11 h-11 rounded-xl bg-primary-subtle border border-primary/15 flex items-center justify-center">
                  {renderStatIcon(stat.icon)}
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

  // 3. Grid Variant (Default) — High-contrast architectural primary band
  return (
    <section
      className="py-16 sm:py-20 text-primary-foreground"
      style={{
        background:
          'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 75%, #020617) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content.title && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-[-0.02em] text-white">
              {content.title}
            </h2>
          </div>
        )}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-x-reverse lg:divide-white/15 text-center"
        >
          {items.map((stat, idx) => (
            <motion.div key={idx} variants={fadeUpItem} className="px-4 py-2 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-white/15 mx-auto flex items-center justify-center mb-1">
                {renderStatIcon(stat.icon, 'w-5 h-5 text-white')}
              </div>
              <div className="text-3xl sm:text-5xl font-black font-heading tracking-tight tabular-nums text-white">
                <AnimatedStatValue value={stat.value} />
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white/80">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
