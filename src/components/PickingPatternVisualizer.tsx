"use client";

/**
 * Picking pattern data: each beat specifies which strings are plucked and
 * optionally which right-hand finger (PIMA) to use.
 *
 * Standard PIMA:
 *   p = thumb (pulgar)   — typically bass strings (6, 5, 4)
 *   i = index (índice)   — typically string 3
 *   m = middle (medio)   — typically string 2
 *   a = ring (anular)    — typically string 1
 */

export interface PickingBeat {
  /** Which strings are plucked on this beat (1=high e … 6=low E) */
  strings: number[];
  /** Right-hand finger for each string: p, i, m, a */
  fingers?: string[];
}

export interface PickingPattern {
  id: string;
  name: string;
  beats: PickingBeat[];
}

interface PickingPatternVisualizerProps {
  pattern: PickingPattern;
  size?: "sm" | "md" | "lg";
  activeBeat?: number | null;
}

const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

export default function PickingPatternVisualizer({
  pattern,
  size = "md",
  activeBeat = null,
}: PickingPatternVisualizerProps) {
  const strings = [1, 2, 3, 4, 5, 6]; // high e to low E
  const beats = pattern.beats;

  const sizeConfig = {
    sm: {
      container: "p-3",
      label: "text-[10px]",
      labelWidth: "w-4",
      dot: "w-3.5 h-3.5 text-[10px]",
      stringHeight: "h-5",
      fingerLabel: "text-[8px]",
      beatLabel: "text-[9px]",
      gap: "gap-0",
      colGap: "",
    },
    md: {
      container: "p-4",
      label: "text-xs",
      labelWidth: "w-5",
      dot: "w-6 h-6 text-sm",
      stringHeight: "h-6",
      fingerLabel: "text-[9px]",
      beatLabel: "text-[10px]",
      gap: "gap-0.5",
      colGap: "",
    },
    lg: {
      container: "pt-1 pl-1 pr-3 pb-3 md:pt-3 md:pl-3 md:pr-6 md:pb-6",
      label: "text-xs md:text-sm",
      labelWidth: "w-5 md:w-6",
      dot: "w-4 h-4 md:w-6 md:h-6 text-xs md:text-sm",
      stringHeight: "h-5 md:h-8",
      fingerLabel: "text-[9px] md:text-xs",
      beatLabel: "text-[10px] md:text-sm",
      gap: "gap-0",
      colGap: "",
    },
  };

  const s = sizeConfig[size];

  return (
    <div className={`${s.container} w-full`}>
      {/* Tab grid — rows = strings, columns = beats */}
      <div className={`flex flex-col ${s.gap} font-mono relative`}>
        {/* Finger labels row (PIMA) — above strings */}
        <div className={`flex items-center ${s.stringHeight}`}>
          {/* Empty spacer for string label column */}
          <span className={`${s.labelWidth} shrink-0 mr-2`} />
          <div className="flex-1 flex">
            {beats.map((beat, bi) => {
              const isActive = activeBeat !== null && activeBeat === bi;
              // Show finger labels if available
              const fingerStr = beat.fingers?.join("") ?? "";
              return (
                <div
                  key={bi}
                  className={`flex-1 flex items-center justify-center ${s.fingerLabel} font-semibold ${
                    isActive ? "text-amber-400" : "text-violet-500"
                  }`}
                >
                  {fingerStr || ""}
                </div>
              );
            })}
          </div>
        </div>

        {/* String rows */}
        {strings.map((stringNum) => {
          return (
            <div
              key={stringNum}
              className={`flex items-center ${s.stringHeight} relative`}
            >
              {/* String label */}
              <span
                className={`${s.label} ${s.labelWidth} text-slate-400 font-bold shrink-0 text-right mr-2`}
              >
                {STRING_LABELS[stringNum - 1]}
              </span>

              {/* String line + dots */}
              <div className="flex-1 relative flex items-center">
                {/* Continuous string line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-slate-300" />

                {/* Beat columns */}
                <div className="flex-1 flex">
                  {beats.map((beat, bi) => {
                    const isPlucked = beat.strings.includes(stringNum);
                    const isActive = activeBeat !== null && activeBeat === bi;
                    const fingerIdx = beat.strings.indexOf(stringNum);
                    const finger =
                      fingerIdx >= 0 && beat.fingers
                        ? beat.fingers[fingerIdx]
                        : null;

                    return (
                      <div
                        key={bi}
                        className="flex-1 flex items-center justify-center relative z-10"
                      >
                        {isPlucked ? (
                          <span
                            className={`${s.dot} flex items-center justify-center rounded-full font-bold transition-colors duration-150 ${
                              isActive
                                ? "bg-amber-400 text-slate-900 ring-2 ring-amber-300 shadow-lg shadow-amber-400/40"
                                : finger === "p"
                                ? "bg-blue-500 text-white"
                                : finger === "i"
                                ? "bg-emerald-500 text-white"
                                : finger === "m"
                                ? "bg-violet-500 text-white"
                                : finger === "a"
                                ? "bg-rose-400 text-white"
                                : "bg-slate-700 text-white"
                            }`}
                          >
                            {finger ?? "●"}
                          </span>
                        ) : (
                          <span
                            className={`${s.label} ${
                              isActive ? "text-amber-400/30" : "text-slate-200"
                            }`}
                          >
                            —
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Beat numbers below */}
        <div className="flex items-center mt-1">
          <span className={`${s.labelWidth} shrink-0 mr-2`} />
          <div className="flex-1 flex">
            {beats.map((_, bi) => {
              const isActive = activeBeat !== null && activeBeat === bi;
              return (
                <div
                  key={bi}
                  className={`flex-1 text-center font-mono ${s.beatLabel} ${
                    isActive
                      ? "text-amber-400 font-bold"
                      : bi % 2 === 0
                      ? "text-slate-500 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {bi % 2 === 0 ? Math.floor(bi / 2) + 1 : "+"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PIMA Legend */}
      <div className="mt-2 md:mt-3 flex items-center justify-center gap-2 md:gap-3 flex-wrap">
        {[
          { finger: "p", label: "thumb", color: "bg-blue-500" },
          { finger: "i", label: "index", color: "bg-emerald-500" },
          { finger: "m", label: "middle", color: "bg-violet-500" },
          { finger: "a", label: "ring", color: "bg-rose-400" },
        ].map(({ finger, label, color }) => (
          <div key={finger} className="flex items-center gap-1">
            <span
              className={`w-4 h-4 md:w-6 md:h-6 rounded-full ${color} inline-flex items-center justify-center text-[10px] md:text-sm font-bold text-white font-mono`}
            >
              {finger}
            </span>
            <span className="text-xs md:text-sm text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
