import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface RtlCarouselAdapterProps {
  children: React.ReactNode[];
  autoplayDelayMs?: number;
  slideClassName?: string;
  radiusClass?: string;
}

/**
 * Application Adapter wrapping embla-carousel-react + embla-carousel-autoplay.
 * Configured natively for RTL Arabic layout with accessible prev/next controls and dot indicators.
 */
export const RtlCarouselAdapter: React.FC<RtlCarouselAdapterProps> = ({
  children,
  autoplayDelayMs = 4500,
  slideClassName = 'min-w-[300px] sm:min-w-[360px] max-w-[360px]',
  radiusClass = 'rounded-xl',
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      direction: 'rtl',
      align: 'start',
      loop: children.length > 2,
      skipSnaps: false,
    },
    [Autoplay({ delay: autoplayDelayMs, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative space-y-5" dir="rtl">
      <div className="overflow-hidden py-2 px-1" ref={emblaRef}>
        <div className="flex gap-6">
          {children.map((child, idx) => (
            <div key={idx} className={`shrink-0 ${slideClassName}`}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {children.length > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2">
            {children.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`الانتقال إلى الشريحة ${idx + 1}`}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === selectedIndex ? 'w-7 bg-primary' : 'w-2 bg-border hover:bg-primary/40'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="الشريحة السابقة"
              className={`w-9 h-9 bg-surface border border-border flex items-center justify-center text-text-main hover:border-primary hover:text-primary active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer ${radiusClass}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="الشريحة التالية"
              className={`w-9 h-9 bg-surface border border-border flex items-center justify-center text-text-main hover:border-primary hover:text-primary active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer ${radiusClass}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
