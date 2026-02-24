import Button from "./Button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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
    return `0:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="px-4 py-3 md:px-6 md:py-4">
        {/* Mobile-first: single compact row */}
        <div className="flex items-center justify-between gap-3 min-h-12">
          {/* Left: Back button or spacer */}
          <div className="w-10 shrink-0">
            {(mode === "ready" || mode === "finished") && onBack ? (
              <button
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors active:scale-90 cursor-pointer"
                aria-label="Back to selection"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            ) : (mode === "prep" || mode === "drill") && onEnd ? (
              <button
                onClick={onEnd}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors active:scale-90 cursor-pointer md:hidden"
                aria-label="End drill"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          {/* Center: Status + Timer */}
          <div className="flex flex-1 flex-col items-center justify-center min-w-0">
            {mode === "ready" && (
              <>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Ready
                </span>
                <span className="text-sm font-semibold text-slate-200 truncate max-w-full">
                  {title}
                </span>
              </>
            )}

            {mode === "prep" && (
              <>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Starting in
                </span>
                <span className="text-2xl md:text-4xl font-black tabular-nums text-blue-400 leading-tight animate-pulse">
                  {countdown}
                </span>
              </>
            )}

            {mode === "drill" && (
              <>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:block">
                  {title}
                </span>
                <span className={`text-2xl md:text-4xl font-black tabular-nums leading-tight ${timer <= 5 ? "text-red-400" : "text-blue-400"}`}>
                  {formatTimer(timer)}
                </span>
              </>
            )}

            {mode === "finished" && (
              <>
                <span className="text-sm font-semibold text-green-400">
                  Drill Complete!
                </span>
                <span className="text-xs text-slate-500 hidden md:block">
                  {title}
                </span>
              </>
            )}
          </div>

          {/* Right: Action button */}
          <div className="w-10 shrink-0 flex justify-end">
            {(mode === "prep" || mode === "drill") && onEnd && (
              <Button
                onClick={onEnd}
                variant="danger"
                size="sm"
                className="hidden md:inline-flex"
              >
                End
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
