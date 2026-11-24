import React from 'react';
import { motion } from 'framer-motion';
import { ContactContent, LandingTheme } from '../types';
import { getRadiusClass } from './common';
import { VIEWPORT_ONCE, staggerContainer, staggerFast, fadeUpItem, blurUp, drawLine } from './motion';
import { Phone, MessageCircle, Mail, MapPin, ArrowUpLeft } from 'lucide-react';

interface ContactSectionProps {
  content: ContactContent;
  variant: string;
  theme?: LandingTheme;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ content, variant, theme }) => {
  const radiusClass = getRadiusClass(theme?.borderRadius);

  const contactCards = [
    content.phone && {
      icon: <Phone className="w-5 h-5 text-primary" />,
      label: 'اتصال هاتفي',
      value: content.phone,
      actionText: 'اتصل الآن',
      href: `tel:${content.phone}`,
    },
    content.whatsapp && {
      icon: <MessageCircle className="w-5 h-5 text-emerald-600" />,
      label: 'واتساب الدعم',
      value: content.whatsapp,
      actionText: 'محادثة فورية',
      href: `https://wa.me/${content.whatsapp.replace(/\D/g, '')}`,
    },
    content.email && {
      icon: <Mail className="w-5 h-5 text-primary" />,
      label: 'البريد الإلكتروني',
      value: content.email,
      actionText: 'إرسال رسالة',
      href: `mailto:${content.email}`,
    },
    content.address && {
      icon: <MapPin className="w-5 h-5 text-primary" />,
      label: 'المقر أو المركز',
      value: content.address,
      actionText: undefined,
      href: undefined,
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    actionText?: string;
    href?: string;
  }>;

  if (contactCards.length === 0) return null;

  /* ── 1. Compact Variant ─────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <section className="py-14 bg-primary-subtle/50 border-t border-border-subtle">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6"
        >
          <motion.h2 variants={blurUp} className="text-2xl sm:text-3xl font-black font-heading text-text-main tracking-[-0.02em]">
            {content.title || 'تواصل معنا مباشرة'}
          </motion.h2>
          <motion.div variants={staggerFast} className="flex flex-wrap items-center justify-center gap-3.5">
            {contactCards.map((c, i) =>
              c.href ? (
                <motion.a
                  key={i}
                  variants={fadeUpItem}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center gap-2.5 px-5 py-3 bg-surface border border-border hover:border-primary/50 hover:shadow-sm text-sm font-semibold text-text-main transition-all ${radiusClass}`}
                >
                  {c.icon}
                  <span>{c.label}:</span>
                  <span className="text-primary font-mono tabular-nums" dir="ltr">
                    {c.value}
                  </span>
                </motion.a>
              ) : (
                <motion.div
                  key={i}
                  variants={fadeUpItem}
                  className={`inline-flex items-center gap-2.5 px-5 py-3 bg-surface border border-border text-sm font-semibold text-text-main ${radiusClass}`}
                >
                  {c.icon}
                  <span>{c.value}</span>
                </motion.div>
              )
            )}
          </motion.div>
        </motion.div>
      </section>
    );
  }

  /* ── 2. Split Variant ───────────────────────────────────────────── */
  if (variant === 'split') {
    return (
      <section className="py-20 sm:py-28 bg-surface border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="lg:col-span-5 space-y-5 text-start"
            >
              <motion.div variants={drawLine} className="w-12 h-1 rounded-full bg-primary" aria-hidden="true" />
              <motion.h2 variants={blurUp} className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em]">
                {content.title || 'هل لديك أي استفسار؟'}
              </motion.h2>
              <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted leading-[1.8]">
                {content.subtitle ||
                  'لا تتردد في التواصل معنا للحصول على المساعدة التقنية أو الاستفسار عن المواعيد والاشتراكات.'}
              </motion.p>
            </motion.div>
            <motion.div
              variants={staggerFast}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="lg:col-span-7"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {contactCards.map((c, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUpItem}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className={`p-6 bg-bg border border-border hover:border-primary/40 transition-colors space-y-3.5 text-start ${radiusClass}`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center">
                      {c.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-text-muted">{c.label}</h3>
                      <p
                        className="text-base font-bold text-text-main font-mono tabular-nums mt-1 break-all"
                        dir={c.href ? 'ltr' : 'rtl'}
                      >
                        {c.value}
                      </p>
                    </div>
                    {c.href && (
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
                      >
                        <span>{c.actionText}</span>
                        <ArrowUpLeft className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  /* ── 3. Cards Variant (Default) ─────────────────────────────────── */
  return (
    <section className="py-20 sm:py-28 bg-surface border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="text-center max-w-2xl mx-auto mb-14 space-y-3.5"
        >
          <motion.div variants={drawLine} className="w-10 h-1 rounded-full bg-primary mx-auto" aria-hidden="true" />
          <motion.h2 variants={blurUp} className="text-3xl sm:text-4xl font-black font-heading text-text-main tracking-[-0.02em]">
            {content.title || 'تواصل معنا في أي وقت'}
          </motion.h2>
          {content.subtitle && (
            <motion.p variants={fadeUpItem} className="text-base sm:text-lg text-text-muted">
              {content.subtitle}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {contactCards.map((c, i) => (
            <motion.div
              key={i}
              variants={fadeUpItem}
              whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.1)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={`p-6 bg-bg border border-border hover:border-primary/40 transition-colors text-start flex flex-col justify-between space-y-5 ${radiusClass}`}
            >
              <div className="space-y-4">
                <div className="relative w-11 h-11">
                  <div className="absolute inset-0 rounded-xl bg-primary-subtle border border-primary/15 flex items-center justify-center">
                    {c.icon}
                  </div>
                  <motion.span
                    className="absolute inset-0 rounded-xl border border-primary/25"
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: i * 0.4 }}
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-text-muted">{c.label}</h3>
                  <p
                    className="text-base font-bold text-text-main font-mono tabular-nums break-all"
                    dir={c.href ? 'ltr' : 'rtl'}
                  >
                    {c.value}
                  </p>
                </div>
              </div>
              {c.href && (
                <a
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`w-full py-2.5 px-3 text-xs font-bold bg-surface border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors inline-flex items-center justify-center gap-1.5 ${radiusClass}`}
                >
                  <span>{c.actionText}</span>
                  <ArrowUpLeft className="w-3.5 h-3.5" />
                </a>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
