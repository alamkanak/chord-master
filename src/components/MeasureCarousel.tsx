"use client";

import { useRef, useEffect, useCallback, useState, type ReactNode } from "react";

interface CarouselItem {
  key: string;
  label?: string;
  content: ReactNode;
}

interface MeasureCarouselProps {
  items: CarouselItem[];
  activeIndex: number;
  /** Subtitle shown below the active label */
  subtitle?: string;
}

/**
 * A smooth horizontal carousel with center-focused scaling.
 * The active item is scaled up and fully opaque.
 * Previous/next items are scaled down and partially visible on left/right.
 * Transitions animate smoothly on index change.
 *
 * Cards are positioned via individual translateX offsets so that the
 * *visual* gap between every pair of adjacent cards is identical,
 * regardless of each card's scale factor.
 */
export default function MeasureCarousel({
  items,
  activeIndex,
  subtitle,
}: MeasureCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const widthRef = useRef(0);

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w !== widthRef.current) {
          widthRef.current = w;
          setContainerWidth(w);
        }
      }
    },
    []
  );

  // Measure container width for centering calculations
  useEffect(() => {
    const el = trackRef.current?.parentElement;
    if (!el) return;
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleResize]);

  // Item width calculation — the center card takes ~60% of container on mobile, ~45% on larger
  const itemWidth = containerWidth > 0 ? Math.min(containerWidth * 0.6, 280) : 240;
  const visualGap = 12; // consistent visual gap between scaled cards

  // Compute scale for each item based on distance from active
  const getScale = (index: number) => {
    const distance = Math.abs(index - activeIndex);
    return distance === 0 ? 1 : distance === 1 ? 0.78 : 0.6;
  };

  // Compute cumulative X positions so each card's *visual* edge is
  // exactly `visualGap` from its neighbour's visual edge.
  // Visual width of card i = itemWidth * scale(i)
  // Position of card i's visual center = sum of all preceding visual
  // half-widths, gaps, plus its own visual half-width.
  //
  // We compute leftEdge[i] (the visual left edge of card i).
  // leftEdge[0] = 0
  // leftEdge[i] = leftEdge[i-1] + visualWidth[i-1]/2 + visualGap + visualWidth[i]/2
  //             ... but since all cards are centered in their layout box,
  //             we track the visual center of each card.

  // Center position of each card (visual center relative to card 0's center)
  const centers: number[] = [];
  if (items.length > 0) {
    centers.push(0);
    for (let i = 1; i < items.length; i++) {
      const prevVisualHalf = (itemWidth * getScale(i - 1)) / 2;
      const currVisualHalf = (itemWidth * getScale(i)) / 2;
      centers.push(centers[i - 1] + prevVisualHalf + visualGap + currVisualHalf);
    }
  }

  // The active card's center should be at containerWidth / 2
  const activeCenter = centers[activeIndex] ?? 0;
  const containerCenter = containerWidth / 2;

  return (
    <div
      className="w-full overflow-hidden relative"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      {/* Track — no flex gap; children are absolutely positioned within a relative container */}
      <div
        ref={trackRef}
        className="relative transition-none"
        style={{
          /* tall enough for the largest card; content drives height via the active item */
          height: 'auto',
        }}
      >
        {/* Invisible spacer so the container gets the active card's height */}
        <div
          className="invisible"
          style={{ width: `${itemWidth}px` }}
          aria-hidden
        >
          {items[activeIndex] && (
            <div className="rounded-2xl overflow-hidden">
              {items[activeIndex].label && (
                <div className="px-4 py-2 text-center border-b">
                  <span className="text-[10px] font-bold uppercase tracking-widest">&nbsp;</span>
                  <p className="text-sm font-semibold mt-0.5">{items[activeIndex].label}</p>
                </div>
              )}
              <div className="p-3 md:p-4 flex items-center justify-center">
                {items[activeIndex].content}
              </div>
            </div>
          )}
        </div>

        {/* Visible cards layered on top */}
        {items.map((item, i) => {
          const distance = Math.abs(i - activeIndex);
          const isActive = i === activeIndex;
          const isPrev = i === activeIndex - 1;
          const isNext = i === activeIndex + 1;
          const isVisible = distance <= 2;

          const scale = getScale(i);
          const opacity = isActive ? 1 : distance === 1 ? 0.5 : 0.25;

          // Position: card's visual center should be at
          //   containerCenter + (centers[i] - activeCenter)
          // The card's layout box is itemWidth wide, so its layout center
          // is at left + itemWidth/2. We set left so that the layout center
          // lands at the desired visual center.
          const desiredCenter = containerCenter + (centers[i] - activeCenter);
          const left = desiredCenter - itemWidth / 2;

          return (
            <div
              key={item.key}
              className="absolute top-1/2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,left]"
              style={{
                width: `${itemWidth}px`,
                left: `${left}px`,
                transform: `scale(${scale}) translateY(-50%)`,
                opacity: isVisible ? opacity : 0,
                transformOrigin: 'center center',
              }}
            >
              {/* Card */}
              <div
                className={`rounded-2xl overflow-hidden transition-all duration-500 ${
                  isActive
                    ? "bg-white shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                    : "bg-white/90 shadow-lg"
                }`}
              >
                {/* Label badge */}
                {item.label && (
                  <div
                    className={`px-4 py-2 text-center border-b transition-colors duration-500 ${
                      isActive
                        ? "border-blue-100 bg-blue-50/50"
                        : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {isPrev ? "Previous" : isNext ? "Up Next" : isActive ? "Now Playing" : ""}
                    </span>
                    <p
                      className={`text-sm font-semibold mt-0.5 transition-colors duration-500 ${
                        isActive ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div className="p-3 md:p-4 flex items-center justify-center">
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtitle / section info below */}
      {subtitle && (
        <div className="text-center mt-3">
          <span className="text-xs font-medium text-slate-500">{subtitle}</span>
        </div>
      )}
    </div>
  );
}
