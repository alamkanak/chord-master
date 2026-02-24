"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

type Tick = "D" | "u" | null;

function generateBeatLabels(tickCount: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < tickCount; i++) {
    if (i % 2 === 0) {
      labels.push(String(Math.floor(i / 2) + 1));
    } else {
      labels.push("+");
    }
  }
  return labels;
}

function tickToDisplay(tick: Tick): string {
  if (tick === "D") return "D";
  if (tick === "u") return "u";
  return "·";
}

interface PatternVisualizerProps {
  ticks: Tick[];
  size?: "sm" | "md" | "lg";
  activeTick?: number | null;
}

export default function PatternVisualizer({
  ticks,
  size = "md",
  activeTick = null,
}: PatternVisualizerProps) {
  const sizeClasses = {
    sm: "text-base sm:text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-4xl md:text-5xl",
  };

  const tickSizeClasses = {
    sm: "min-w-0 flex-1 h-12 sm:h-14",
    md: "min-w-0 flex-1 h-14 sm:h-18",
    lg: "min-w-0 flex-1 h-16 sm:h-24 md:h-28",
  };

  const labelSize = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-sm sm:text-lg md:text-xl",
  };

  const arrowSizes = {
    sm: { w: 12, h: 12, smW: 15, smH: 15 },
    md: { w: 12, h: 12, smW: 14, smH: 14 },
    lg: { w: 14, h: 14, smW: 20, smH: 20 },
  };

  const arrow = arrowSizes[size];

  const beatLabels = generateBeatLabels(ticks.length);

  return (
    <div className="flex items-end justify-center gap-0 sm:gap-0.5 w-full max-w-full">
      {ticks.map((tick, i) => {
        const isDownbeat = i % 2 === 0;
        const isActive = activeTick !== null && activeTick === i;
        return (
          <div
            key={i}
            className={`flex flex-col items-center justify-end ${tickSizeClasses[size]} ${
              isActive ? "scale-110 transition-transform duration-100" : "transition-transform duration-100"
            }`}
          >
            <span
              className={`${sizeClasses[size]} font-bold leading-none ${
                isActive
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  : tick === "D"
                  ? "text-blue-600"
                  : tick === "u"
                  ? "text-emerald-500"
                  : "text-slate-300"
              }`}
            >
              {tickToDisplay(tick)}
            </span>
            {/* Arrow container — responsive sizing via CSS */}
            <div
              className="mt-0.5 flex items-center justify-center shrink-0"
              style={{ width: arrow.w, height: arrow.h }}
            >
              {tick &&
                (tick === "D" ? (
                  <ChevronDownIcon
                    className={`w-full h-full ${isActive ? "text-amber-400" : "text-blue-400"}`}
                  />
                ) : (
                  <ChevronUpIcon
                    className={`w-full h-full ${isActive ? "text-amber-400" : "text-emerald-400"}`}
                  />
                ))}
            </div>
            <span
              className={`${labelSize[size]} mt-0.5 font-mono ${
                isActive
                  ? "text-amber-400 font-bold"
                  : isDownbeat
                  ? "text-slate-500 font-semibold"
                  : "text-slate-400"
              }`}
            >
              {beatLabels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
