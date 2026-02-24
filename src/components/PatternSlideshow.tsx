"use client";

import { useRef, useEffect, useCallback, useState, type ReactNode } from "react";

interface SlideItem {
  key: string;
  label?: string;
  content: ReactNode;
}

interface PatternSlideshowProps {
  items: SlideItem[];
  activeIndex: number;
}

/**
 * A horizontal slideshow for patterns (strum/picking/riff).
 * The active pattern is centered and fully visible.
 * Previous/next patterns are partially visible at the edges, clipped,
 * creating a "peek" / slideshow effect.
 */
export default function PatternSlideshow({
  items,
  activeIndex,
}: PatternSlideshowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const widthRef = useRef(0);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const w = Math.round(entry.contentRect.width);
      // Only update state if width actually changed (ignore height-only changes)
      if (w !== widthRef.current) {
        widthRef.current = w;
        setContainerWidth(w);
      }
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleResize]);

  // Each slide takes full container width, but we show partial edges of neighbors
  const peekWidth = containerWidth > 640 ? 60 : 32;
  const slideGap = containerWidth > 640 ? 16 : 10;
  const slideWidth = containerWidth > 0 ? containerWidth - peekWidth * 2 - slideGap * 2 : 0;

  // Calculate translateX to center active slide
  const totalSlideWidth = slideWidth + slideGap;
  const translateX =
    containerWidth > 0
      ? peekWidth + slideGap - activeIndex * totalSlideWidth
      : 0;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden relative"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      {/* Slide track */}
      <div
        className="flex items-start transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{
          transform: `translateX(${translateX}px)`,
          gap: `${slideGap}px`,
        }}
      >
        {items.map((item, i) => {
          const distance = Math.abs(i - activeIndex);
          const isActive = i === activeIndex;
          const isVisible = distance <= 2;

          return (
            <div
              key={item.key}
              className="shrink-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: slideWidth > 0 ? `${slideWidth}px` : "100%",
                opacity: isVisible ? (isActive ? 1 : 0.35) : 0,
              }}
            >
              <div
                className={`rounded-2xl overflow-hidden h-full ${
                  isActive
                    ? "bg-white shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                    : "bg-white/80 shadow-md"
                }`}
              >
                {/* Label */}
                {item.label && (
                  <div
                    className={`px-4 py-2 text-center border-b ${
                      isActive
                        ? "border-blue-100 bg-blue-50/50"
                        : "border-slate-100 bg-slate-50/30"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-2 sm:p-3 md:p-4">{item.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
