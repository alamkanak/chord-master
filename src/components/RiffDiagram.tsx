"use client";

interface RiffNote {
  string: number; // 1=high e, 6=low E
  fret: number;
  beat: number;
}

interface RiffData {
  id: string;
  name: string;
  description: string;
  tuning: string[];
  notes: RiffNote[];
}

interface RiffDiagramProps {
  riff: RiffData;
  size?: "sm" | "md" | "lg";
  activeBeat?: number | null;
}

const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

export default function RiffDiagram({
  riff,
  size = "md",
  activeBeat = null,
}: RiffDiagramProps) {
  const strings = [1, 2, 3, 4, 5, 6];

  // Find the range of beats to display
  const beats = riff.notes.map((n) => n.beat);
  const maxBeat = Math.max(...beats);
  const totalSlots = Math.ceil(maxBeat + 0.5);

  const sizeClasses = {
    sm: {
      container: "p-3",
      title: "text-sm font-semibold",
      label: "text-[10px]",
      note: "text-xs w-5 h-5",
      stringHeight: "h-5",
      gap: "gap-0",
    },
    md: {
      container: "p-4",
      title: "text-base font-bold",
      label: "text-xs",
      note: "text-sm w-6 h-6",
      stringHeight: "h-6",
      gap: "gap-0.5",
    },
    lg: {
      container: "p-5 md:p-6",
      title: "text-lg md:text-xl font-bold",
      label: "text-sm",
      note: "text-base w-7 h-7 md:w-8 md:h-8",
      stringHeight: "h-7 md:h-8",
      gap: "gap-0.5",
    },
  };

  const s = sizeClasses[size];

  return (
    <div className={`${s.container} w-full`}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className={`${s.title} text-slate-800`}>{riff.name}</span>
      </div>

      {/* Tab Grid */}
      <div className={`flex flex-col ${s.gap} font-mono relative`}>
        {strings.map((stringNum) => {
          const stringNotes = riff.notes.filter(
            (n) => n.string === stringNum
          );

          return (
            <div
              key={stringNum}
              className={`flex items-center ${s.stringHeight} relative`}
            >
              {/* String label */}
              <span
                className={`${s.label} text-slate-400 font-bold w-5 shrink-0 text-right mr-2`}
              >
                {STRING_LABELS[stringNum - 1]}
              </span>

              {/* String line + notes */}
              <div className="flex-1 relative flex items-center">
                {/* String line background */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-slate-300" />

                {/* Beat slots */}
                <div className="flex-1 flex">
                  {Array.from({ length: totalSlots * 2 }, (_, i) => {
                    const slotBeat = (i + 1) * 0.5;
                    const note = stringNotes.find(
                      (n) => Math.abs(n.beat - slotBeat) < 0.01
                    );
                    const isActive =
                      activeBeat !== null &&
                      note &&
                      Math.abs(note.beat - activeBeat) < 0.01;

                    return (
                      <div
                        key={i}
                        className="flex-1 flex items-center justify-center relative z-10"
                      >
                        {note ? (
                          <span
                            className={`${s.note} flex items-center justify-center rounded font-bold transition-colors duration-150 ${
                              isActive
                                ? "bg-amber-400 text-slate-900 ring-2 ring-amber-300 shadow-lg shadow-amber-400/40"
                                : "bg-slate-800 text-white"
                            }`}
                          >
                            {note.fret}
                          </span>
                        ) : (
                          <span className={`${s.label} text-slate-200`}>
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
          <span className="w-5 shrink-0 mr-2" />
          <div className="flex-1 flex">
            {Array.from({ length: totalSlots * 2 }, (_, i) => {
              const slotBeat = (i + 1) * 0.5;
              const isWhole = slotBeat === Math.floor(slotBeat);
              return (
                <div
                  key={i}
                  className={`flex-1 text-center ${s.label} ${
                    isWhole
                      ? "text-slate-500 font-semibold"
                      : "text-slate-300"
                  }`}
                >
                  {isWhole ? slotBeat : "+"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Description */}
      {riff.description && (
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          {riff.description}
        </p>
      )}
    </div>
  );
}
