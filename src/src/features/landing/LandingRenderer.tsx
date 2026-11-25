import React from 'react';
import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion';
import { LandingPageConfig } from './types';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { StatsSection } from './sections/StatsSection';
import { SubjectsSection } from './sections/SubjectsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FaqSection } from './sections/FaqSection';
import { ContactSection } from './sections/ContactSection';
import { FooterSection } from './sections/FooterSection';

interface LandingRendererProps {
  config: LandingPageConfig;
  tenantName?: string;
  previewSubjects?: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    lessonsCount?: number;
  }>;
  isPreview?: boolean;
  className?: string;
}

export const LandingRenderer: React.FC<LandingRendererProps> = ({
  config,
  tenantName,
  previewSubjects,
  isPreview = false,
  className = '',
}) => {
  const { theme, sections } = config;
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  // Build CSS variable overrides for live theming on the page wrapper (Warm Alabaster Paper system)
  const rawBg = theme.backgroundColor;
  const resolvedBg =
    !rawBg || rawBg.toUpperCase() === '#FFFFFF' || rawBg.toUpperCase() === '#F8FAFC'
      ? `color-mix(in srgb, ${theme.primaryColor || '#3730A3'} 2.5%, #FAF7F2)`
      : rawBg;

  const rawText = theme.textColor;
  const resolvedText =
    !rawText || rawText.toUpperCase() === '#0F172A' ? '#1C1917' : rawText;

  const primaryHex = theme.primaryColor || '#3730A3';

  const themeStyles: React.CSSProperties & Record<string, string> = {
    '--color-primary': primaryHex,
    '--color-primary-hover': `color-mix(in srgb, ${primaryHex} 86%, #1C1917)`,
    '--color-primary-active': `color-mix(in srgb, ${primaryHex} 72%, #1C1917)`,
    '--color-primary-light': `color-mix(in srgb, ${primaryHex} 14%, #FFFDF9)`,
    '--color-primary-subtle': `color-mix(in srgb, ${primaryHex} 6.5%, #FAF7F2)`,
    '--color-secondary': theme.secondaryColor || '#D97706',
    '--color-bg': resolvedBg,
    '--color-surface': '#FFFDF9',
    '--color-surface-hover': `color-mix(in srgb, ${primaryHex} 5%, #F4EFE6)`,
    '--color-surface-subtle': `color-mix(in srgb, ${primaryHex} 4%, #F3EDE2)`,
    '--color-border': `color-mix(in srgb, ${primaryHex} 10%, #E6DFD3)`,
    '--color-border-subtle': `color-mix(in srgb, ${primaryHex} 6%, #EFE9DF)`,
    '--color-text-main': resolvedText,
    '--color-text-muted': '#57534E',
    '--font-family-heading': `"Readex Pro", "${theme.fontFamily || 'IBM Plex Sans Arabic'}", sans-serif`,
    '--font-family-base': `"IBM Plex Sans Arabic", "${theme.fontFamily || 'Readex Pro'}", sans-serif`,
    fontFamily: `"IBM Plex Sans Arabic", "Readex Pro", "${theme.fontFamily || 'Cairo'}", system-ui, sans-serif`,
    backgroundColor: resolvedBg,
    color: resolvedText,
  };

  const enabledSections = (sections || []).filter((s) => s.enabled);

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={themeStyles}
        className={`relative w-full min-h-screen overflow-x-hidden transition-colors duration-200 ${className}`}
        dir="rtl"
      >
        {/* Top Spring Scroll Progress Indicator */}
        {!isPreview && (
          <motion.div
            style={{ scaleX, transformOrigin: '100% 50%' }}
            className="fixed top-0 inset-x-0 h-1 bg-primary z-50 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {enabledSections.map((section) => {
          const key = section.id || section.type;
          const content = section.content || {};

          switch (section.type) {
            case 'hero':
              return (
                <div key={key}>
                  <HeroSection content={content as any} variant={section.variant} theme={theme} />
                </div>
              );
            case 'about':
              return (
                <div key={key}>
                  <AboutSection content={content as any} variant={section.variant} theme={theme} />
                </div>
              );
            case 'stats':
              return (
                <div key={key}>
                  <StatsSection content={content as any} variant={section.variant} theme={theme} />
                </div>
              );
            case 'subjects':
              return (
                <div key={key}>
                  <SubjectsSection
                    content={content as any}
                    variant={section.variant}
                    theme={theme}
                    previewSubjects={previewSubjects}
                  />
                </div>
              );
            case 'testimonials':
              return (
                <div key={key}>
                  <TestimonialsSection content={content as any} variant={section.variant} theme={theme} />
                </div>
              );
            case 'faq':
              return (
                <div key={key}>
                  <FaqSection content={content as any} variant={section.variant} theme={theme} />
                </div>
              );
            case 'contact':
              return (
                <div key={key}>
                  <ContactSection content={content as any} variant={section.variant} theme={theme} />
                </div>
              );
            case 'footer':
              return (
                <div key={key}>
                  <FooterSection
                    content={content as any}
                    variant={section.variant}
                    theme={theme}
                    tenantName={tenantName}
                  />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </MotionConfig>
  );
};
