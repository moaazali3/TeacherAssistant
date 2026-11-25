import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PreviewIframeProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Renders preview content inside a true isolated iframe viewport so Tailwind
 * responsive breakpoints (sm/md/lg) evaluate accurately at the frame's width.
 */
export const PreviewIframe: React.FC<PreviewIframeProps> = ({
  children,
  className = '',
  title = 'معاينة الصفحة',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let headObserver: MutationObserver | null = null;

    const syncStyles = (doc: Document) => {
      if (!doc.head) return;
      doc.head.innerHTML = '';
      const styleNodes = document.head.querySelectorAll('link[rel="stylesheet"], style');
      styleNodes.forEach((node) => {
        doc.head.appendChild(node.cloneNode(true));
      });
    };

    const initializeDocument = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      doc.documentElement.dir = 'rtl';
      doc.documentElement.lang = 'ar';
      doc.body.style.margin = '0';
      doc.body.style.overflowX = 'hidden';

      syncStyles(doc);

      if (!headObserver) {
        headObserver = new MutationObserver(() => syncStyles(doc));
        headObserver.observe(document.head, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }

      setMountNode(doc.body);
    };

    const handleLoad = () => initializeDocument();
    iframe.addEventListener('load', handleLoad);

    if (iframe.contentDocument?.readyState === 'complete') {
      initializeDocument();
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
      headObserver?.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc="<!DOCTYPE html><html dir='rtl' lang='ar'><head></head><body></body></html>"
      className={className}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
};
