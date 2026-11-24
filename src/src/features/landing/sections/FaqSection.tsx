import React, { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { FaqContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { EASE_OUT_EXPO, VIEWPORT_ONCE, staggerContainer, blurUp, fadeUpItem } from './motion';
import { ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  content: FaqContent;
  variant: string;
  theme?: LandingTheme;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);
  const items = Array.isArray(content.items) ? content.items : [];
  const defaultId = items[0]?.id || 'item-0';
  const [openValue, setOpenValue] = useState<string>(defaultId);

  if (items.length === 0) return null;

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="text-center max-w-2xl mx-auto mb-14 space-y-3.5"
        >
          <motion.h2 variants={blurUp} className="text-3xl sm:text-4xl font-bold font-heading text-text-main leading-[1.45]">
            {content.title || 'الأسئلة الأكثر شيوعاً'}
          </motion.h2>
          {content.subtitle && (
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.85]">
              {content.subtitle}
            </motion.p>
          )}
        </motion.div>

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
          /* 3. Accordion Variant (Default) powered by @radix-ui/react-accordion */
          <Accordion.Root
            type="single"
            collapsible
            value={openValue}
            onValueChange={setOpenValue}
            className="space-y-3.5 text-start"
          >
            {items.map((item, idx) => {
              const itemValue = item.id || `item-${idx}`;
              const isOpen = openValue === itemValue;
              return (
                <Accordion.Item
                  key={itemValue}
                  value={itemValue}
                  className={`border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-surface border-primary/40'
                      : 'bg-surface/70 border-border hover:border-border-hover'
                  } ${radiusClass}`}
                >
                  <Accordion.Header className="m-0">
                    <Accordion.Trigger className="w-full p-5 sm:p-6 text-start font-bold text-text-main flex items-center justify-between gap-4 cursor-pointer transition-colors">
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
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <Accordion.Content forceMount asChild>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-text-muted leading-[1.85] border-t border-border-subtle pt-4">
                            {item.answer}
                          </div>
                        </motion.div>
                      </Accordion.Content>
                    )}
                  </AnimatePresence>
                </Accordion.Item>
              );
            })}
          </Accordion.Root>
        )}
      </div>
    </section>
  );
};
