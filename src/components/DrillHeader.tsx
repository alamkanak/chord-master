import Button from "./Button";

interface DrillHeaderProps {
  mode: "select" | "ready" | "prep" | "drill" | "finished";
  countdown?: number;
  timer?: number;
  title?: string;
  onBack?: () => void;
  onEnd?: () => void;
}

export default function DrillHeader({
  mode,
  countdown = 0,
  timer = 0,
  title = "Practice Drill",
  onBack,
  onEnd,
}: DrillHeaderProps) {
  // For select mode, return null (uses Navigation component instead)
  if (mode === "select") {
    return null;
  }

  const formatTimer = (seconds: number) => {
    if (seconds > 59) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    return `${String(seconds).padStart(2, "0")}s`;
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between gap-4 h-28">
          {/* Left Section - Timer/Status */}
          <div className="flex flex-col justify-center w-35">
            {mode === "prep" && (
              <>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Starting In
                </div>
                <div className="text-5xl md:text-6xl font-black text-blue-400 tabular-nums animate-pulse leading-none">
                  {String(countdown).padStart(2, "0")}s
                </div>
              </>
            )}
            {mode === "drill" && (
              <>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Time Remaining
                </div>
                <div className="text-5xl md:text-6xl font-black text-blue-400 tabular-nums leading-none">
                  {formatTimer(timer)}
                </div>
              </>
            )}
            {mode === "ready" && (
              <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                Ready to Start
              </div>
            )}
            {mode === "finished" && (
              <>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                  Drill Complete!
                </div>
                <div className="text-lg font-semibold text-green-400 mt-1">
                  Great job!
                </div>
              </>
            )}
          </div>

          {/* Center Section - Title (hidden on mobile during prep/drill) */}
          <div className={`flex flex-col items-center gap-2 flex-1 ${mode === "prep" || mode === "drill" ? "hidden md:flex" : "flex"}`}>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              Practice Mode
            </div>
            <div className="text-lg font-semibold text-slate-300">
              {title}
            </div>
          </div>

          {/* Right Section - Action Button */}
          <div className="shrink-0">
            {(mode === "ready" || mode === "finished") && onBack && (
              <Button
                onClick={onBack}
                variant="secondary"
                size="md"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                {mode === "finished" ? "Back to Selection" : "Back"}
              </Button>
            )}
            {(mode === "prep" || mode === "drill") && onEnd && (
              <Button onClick={onEnd} variant="danger" size="md">
                End
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
