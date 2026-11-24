import React from 'react';
import { Link } from 'react-router-dom';
import { FooterContent, LandingTheme } from '../types';
import { tenantPath } from '@/lib/tenant';
import { GraduationCap, Send, Globe, Video, MessageCircle } from 'lucide-react';

interface FooterSectionProps {
  content: FooterContent;
  variant: string;
  theme?: LandingTheme;
  tenantName?: string;
}

function renderSocialIcon(platform: string) {
  const p = platform.toLowerCase();
  const iconClass = 'w-4 h-4';
  if (p.includes('telegram')) return <Send className={iconClass} />;
  if (p.includes('youtube') || p.includes('video')) return <Video className={iconClass} />;
  if (p.includes('whatsapp') || p.includes('chat')) return <MessageCircle className={iconClass} />;
  return <Globe className={iconClass} />;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  content,
  variant,
  tenantName,
}) => {
  const links = Array.isArray(content.links) ? content.links : [];
  const socialLinks = Array.isArray(content.socialLinks) ? content.socialLinks : [];

  // 1. Minimal Variant
  if (variant === 'minimal') {
    return (
      <footer className="py-7 border-t border-border bg-surface text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div>{content.copyrightText}</div>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2.5">
              {socialLinks.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors"
                >
                  {renderSocialIcon(s.platform)}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    );
  }

  // 2. Simple Variant
  if (variant === 'simple') {
    return (
      <footer className="py-12 border-t border-border bg-surface text-center space-y-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-center gap-2.5 font-black text-xl font-heading text-text-main">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span>{tenantName || 'المنصة التعليمية'}</span>
          </div>

          {links.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-text-muted">
              {links.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.url.startsWith('/') ? tenantPath(link.url) : link.url}
                  className="hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              {socialLinks.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors"
                >
                  {renderSocialIcon(s.platform)}
                </a>
              ))}
            </div>
          )}

          <div className="pt-6 border-t border-border-subtle text-xs text-text-subtle">
            {content.copyrightText}
          </div>
        </div>
      </footer>
    );
  }

  // 3. Columns Variant (Default)
  return (
    <footer className="py-14 sm:py-16 border-t-2 border-primary/15 bg-surface text-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border-subtle">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5 font-black text-xl font-heading text-text-main">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span>{tenantName || 'المنصة التعليمية'}</span>
            </div>
            <p className="text-sm text-text-muted max-w-md leading-[1.8]">
              منصة تعليمية متكاملة لمساعدة الطلاب على التفوق من خلال شروحات منظمة، تدريبات دورية، ومتابعة مستمرة.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5 pt-2">
                {socialLinks.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors"
                  >
                    {renderSocialIcon(s.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-text-main">روابط سريعة</h4>
            <div className="flex flex-col space-y-2.5 text-sm text-text-muted">
              {links.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.url.startsWith('/') ? tenantPath(link.url) : link.url}
                  className="hover:text-primary transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-text-main">بوابة الطلاب</h4>
            <div className="flex flex-col space-y-2.5 text-sm text-text-muted">
              <Link to={tenantPath('/login')} className="hover:text-primary transition-colors w-fit">
                تسجيل الدخول للطلاب
              </Link>
              <Link to={tenantPath('/register')} className="hover:text-primary transition-colors w-fit">
                إنشاء حساب جديد بكود الجروب
              </Link>
              <Link to={tenantPath('/subjects')} className="hover:text-primary transition-colors w-fit">
                تصفح قائمة المواد
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center sm:text-start flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-subtle">
          <div>{content.copyrightText}</div>
          <div className="flex items-center gap-1.5">
            <span>مدعوم بواسطة</span>
            <span className="font-bold text-text-main">المساعد التعليمي LMS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
