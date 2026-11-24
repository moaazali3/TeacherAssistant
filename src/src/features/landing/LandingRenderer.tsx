import React from 'react';
import { MotionConfig } from 'framer-motion';
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
  className?: string;
}

export const LandingRenderer: React.FC<LandingRendererProps> = ({
  config,
  tenantName,
  previewSubjects,
  className = '',
}) => {
  const { theme, sections } = config;

  // Build CSS variable overrides for live theming on the page wrapper
  const themeStyles: React.CSSProperties & Record<string, string> = {
    '--color-primary': theme.primaryColor || '#0F766E',
    '--color-primary-hover': `color-mix(in srgb, ${theme.primaryColor || '#0F766E'} 85%, black)`,
    '--color-primary-active': `color-mix(in srgb, ${theme.primaryColor || '#0F766E'} 70%, black)`,
    '--color-primary-light': `color-mix(in srgb, ${theme.primaryColor || '#0F766E'} 15%, white)`,
    '--color-primary-subtle': `color-mix(in srgb, ${theme.primaryColor || '#0F766E'} 5%, white)`,
    '--color-secondary': theme.secondaryColor || '#0D9488',
    '--color-bg': theme.backgroundColor || '#FFFFFF',
    '--color-text-main': theme.textColor || '#0F172A',
    fontFamily: `"${theme.fontFamily || 'Cairo'}", Cairo, system-ui, sans-serif`,
    backgroundColor: theme.backgroundColor || '#FFFFFF',
    color: theme.textColor || '#0F172A',
  };

  const enabledSections = (sections || []).filter((s) => s.enabled);

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={themeStyles}
        className={`w-full min-h-screen transition-colors duration-200 ${className}`}
        dir="rtl"
      >
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
