"use client";

import Button from "./Button";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

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

interface PatternBuilderProps {
  ticks: Tick[];
  onChange: (ticks: Tick[]) => void;
}

export default function PatternBuilder({
  ticks,
  onChange,
}: PatternBuilderProps) {
  const beatLabels = generateBeatLabels(ticks.length);
  const beatCount = Math.floor(ticks.length / 2);

  const cycleTick = (index: number) => {
    const newTicks = [...ticks];
    const current = newTicks[index];
    // Cycle: D -> u -> miss -> D
    if (current === "D") newTicks[index] = "u";
    else if (current === "u") newTicks[index] = null;
    else newTicks[index] = "D";
    onChange(newTicks);
  };

  const addBeat = () => {
    if (beatCount >= 12) return; // max 12 beats
    onChange([...ticks, "D", null]);
  };

  const removeBeat = () => {
    if (beatCount <= 1) return; // min 1 beat
    onChange(ticks.slice(0, -2));
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-slate-500 text-center flex-1">
          Tap each beat to cycle:{" "}
          <span className="text-blue-600 font-bold">D</span> →{" "}
          <span className="text-emerald-500 font-bold">u</span> →{" "}
          <span className="text-slate-400">miss</span>
        </div>
      </div>

      {/* Beat count controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={removeBeat}
          disabled={beatCount <= 1}
          className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Remove beat"
        >
          <MinusCircleIcon className="w-6 h-6" />
        </button>
        <span className="text-sm font-semibold text-slate-600 min-w-20 text-center">
          {beatCount} {beatCount === 1 ? "beat" : "beats"}
        </span>
        <button
          onClick={addBeat}
          disabled={beatCount >= 12}
          className="text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Add beat"
        >
          <PlusCircleIcon className="w-6 h-6" />
        </button>
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
                {beatLabels[i]}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
