"use client";

interface LyricsDisplayProps {
  /** Current line of lyrics to display prominently */
  currentLyrics: string;
  /** Next line of lyrics shown as a subtle preview */
  nextLyrics?: string;
  /** Unique key to trigger re-animation on change (e.g. measure index) */
  animationKey?: string | number;
}

export default function LyricsDisplay({
  currentLyrics,
  nextLyrics,
  animationKey,
}: LyricsDisplayProps) {
  return (
    <div className="shrink-0 px-4 py-3 md:px-8 md:py-4 overflow-hidden">
      <div
        className="max-w-2xl mx-auto text-center"
        style={{ minHeight: "5rem" }}
      >
        <div key={animationKey}>
          <div className="lyrics-animate-in">
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white leading-snug tracking-tight">
              {currentLyrics || (
                <span className="opacity-20 italic font-normal text-slate-400 text-base">
                  ··· Instrumental ···
                </span>
              )}
            </p>
          </div>
          {nextLyrics && (
            <div className="lyrics-next-animate-in">
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 truncate">
                {nextLyrics}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
