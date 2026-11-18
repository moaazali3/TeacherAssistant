import React from 'react';
import { LessonDetail } from '../types';
import { getEmbedInfo } from '@/lib/embed';
import { Button } from '@/components/ui/Button';

interface LessonEmbedPlayerProps {
  lesson: LessonDetail;
}

export const LessonEmbedPlayer: React.FC<LessonEmbedPlayerProps> = ({ lesson }) => {
  const embedInfo = getEmbedInfo(lesson.contentUrl, String(lesson.contentType));

  // 1. YOUTUBE EMBED
  if (embedInfo.type === 'youtube' && embedInfo.embedUrl) {
    return (
      <div className="w-full space-y-4">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-border">
          <iframe
            src={embedInfo.embedUrl}
            title={lesson.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted px-1">
          <span>مشغل فيديو تفاعلي (YouTube)</span>
          <a
            href={embedInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <span>المشاهدة على موقع يوتيوب</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  // 2. GOOGLE DRIVE EMBED
  if (embedInfo.type === 'drive' && embedInfo.embedUrl) {
    return (
      <div className="w-full space-y-4">
        <div className="w-full h-[550px] sm:h-[650px] rounded-xl overflow-hidden bg-surface shadow-md border border-border relative">
          <iframe
            src={embedInfo.embedUrl}
            title={lesson.title}
            className="w-full h-full border-0"
            allow="autoplay"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted px-1">
          <span>عرض مستند من Google Drive</span>
          <a
            href={embedInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <span>فتح في Google Drive</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  // 3. PDF EMBED WITH FALLBACK
  if (embedInfo.type === 'pdf') {
    return (
      <div className="w-full space-y-4">
        <div className="w-full h-[550px] sm:h-[700px] rounded-xl overflow-hidden bg-surface shadow-md border border-border relative">
          <iframe
            src={embedInfo.originalUrl}
            title={lesson.title}
            className="w-full h-full border-0"
          />
        </div>

        {/* Fallback & New Tab Action */}
        <div className="p-4 bg-surface rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-bg text-danger flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">مستند بصيغة PDF</p>
              <p className="text-xs text-text-muted">إذا واجهت صعوبة في تصفح المستند المدمج، يمكنك فتحه في علامة تبويب جديدة أو تنزيله.</p>
            </div>
          </div>

          <a
            href={embedInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-full sm:w-auto"
          >
            <Button variant="primary" size="sm" className="w-full sm:w-auto font-bold gap-1.5">
              <span>فتح الملف في نافذة جديدة</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // 4. GENERIC / EXTERNAL LINK
  return (
    <div className="w-full p-8 sm:p-12 bg-surface rounded-2xl border border-border shadow-sm text-center max-w-2xl mx-auto my-6">
      <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>

      <h3 className="text-xl font-bold font-heading text-text-main mb-2">
        محتوى تعليمي خارجي
      </h3>

      <p className="text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
        يتوفر هذا الدرس عبر منصة أو موقع خارجي أعده معلمك. اضغط على الزر أدناه للانتقال للمحتوى مباشرة.
      </p>

      <div className="p-3 bg-surface-subtle border border-border rounded-lg max-w-md mx-auto mb-6 font-mono text-xs text-text-muted truncate dir-ltr">
        {lesson.contentUrl}
      </div>

      <a
        href={lesson.contentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <Button variant="primary" size="lg" className="font-bold gap-2">
          <span>فتح المحتوى التعليمي</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Button>
      </a>
    </div>
  );
};
