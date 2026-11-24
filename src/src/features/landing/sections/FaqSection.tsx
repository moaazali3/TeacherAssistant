import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaqContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { EASE_OUT_EXPO } from './motion';
import { ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  content: FaqContent;
  variant: string;
  theme?: LandingTheme;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const items = Array.isArray(content.items) ? content.items : [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3.5">
          <div className="w-10 h-1 rounded-full bg-primary mx-auto" aria-hidden="true" />
          <h2 className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em]">
            {content.title || 'الأسئلة الأكثر شيوعاً'}
          </h2>
          {content.subtitle && (
            <p className="text-base sm:text-lg text-text-muted">{content.subtitle}</p>
          )}
        </div>

        {/* 1. Cards Variant */}
        {variant === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-7 bg-surface border border-border hover:border-primary/35 transition-colors space-y-3 ${radiusClass}`}
              >
                <h3 className="text-base sm:text-lg font-bold text-text-main leading-snug">
                  {item.question}
                </h3>
                <p className="text-sm text-text-muted leading-[1.8]">{item.answer}</p>
              </div>
            ))}
          </div>
        ) : variant === 'twoColumns' ? (
          /* 2. Two Columns Variant */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-2.5 pb-6 border-b border-border-subtle">
                <h3 className="text-base sm:text-lg font-bold text-text-main leading-snug">
                  {item.question}
                </h3>
                <p className="text-sm text-text-muted leading-[1.8]">{item.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          /* 3. Accordion Variant (Default) */
          <div className="space-y-3.5 text-start">
            {items.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.id || idx}
                  className={`border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-surface border-primary/40 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.08)]'
                      : 'bg-surface/70 border-border hover:border-border-hover'
                  } ${radiusClass}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleAccordion(idx)}
                    className="w-full p-5 sm:p-6 text-start font-bold text-text-main flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <span className="text-base sm:text-lg leading-snug">{item.question}</span>
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-primary text-primary-foreground' : 'bg-bg text-text-muted'
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-text-muted leading-[1.85] border-t border-border-subtle pt-4">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
