"use client";

import Button from "./Button";

type Tick = "D" | "u" | null;

const BEAT_LABELS = ["1", "+", "2", "+", "3", "+", "4", "+"];

function tickToDisplay(tick: Tick): string {
  if (tick === "D") return "D";
  if (tick === "u") return "u";
  return "·";
}

interface PatternBuilderProps {
  ticks: Tick[];
  onChange: (ticks: Tick[]) => void;
}

export default function PatternBuilder({
  ticks,
  onChange,
}: PatternBuilderProps) {
  const cycleTick = (index: number) => {
    const newTicks = [...ticks];
    const current = newTicks[index];
    // Cycle: D -> u -> miss -> D
    if (current === "D") newTicks[index] = "u";
    else if (current === "u") newTicks[index] = null;
    else newTicks[index] = "D";
    onChange(newTicks);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
      <div className="text-sm font-medium text-slate-500 mb-4 text-center">
        Tap each beat to cycle:{" "}
        <span className="text-blue-600 font-bold">D</span> →{" "}
        <span className="text-emerald-500 font-bold">u</span> →{" "}
        <span className="text-slate-400">miss</span>
      </div>
      <div className="flex items-end justify-center gap-1 sm:gap-2 w-full max-w-full">
        {ticks.map((tick, i) => {
          const isDownbeat = i % 2 === 0;
          return (
            <Button
              key={i}
              onClick={() => cycleTick(i)}
              variant="secondary"
              className={`flex-col justify-center min-w-0 flex-1 h-16 sm:h-18 md:h-22 rounded-lg border-2 ${
                tick === "D"
                  ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                  : tick === "u"
                  ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100"
                  : "border-slate-200 bg-white hover:bg-slate-100"
              }`}
            >
              <span
                className={`text-lg sm:text-xl md:text-2xl font-bold leading-none ${
                  tick === "D"
                    ? "text-blue-600"
                    : tick === "u"
                    ? "text-emerald-500"
                    : "text-slate-300"
                }`}
              >
                {tickToDisplay(tick)}
              </span>
              <span
                className={`text-xs sm:text-sm md:text-base mt-1 font-mono ${
                  isDownbeat
                    ? "text-slate-500 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {BEAT_LABELS[i]}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
