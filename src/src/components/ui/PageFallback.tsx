import React from 'react';
import { Spinner } from './Spinner';

export const PageFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150"
    >
      <Spinner size="lg" color="primary" />
      <span className="sr-only">جاري تحميل الصفحة...</span>
    </div>
  );
};
