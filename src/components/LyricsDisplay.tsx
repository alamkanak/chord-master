"use client";

import { useEffect, useRef, useState } from "react";

interface LyricsDisplayProps {
  currentLyrics: string;
  nextLyrics?: string;
  animationKey?: string | number;
}

interface Snapshot {
  current: string;
  next?: string;
}

export default function LyricsDisplay({
  currentLyrics,
  nextLyrics,
  animationKey,
}: LyricsDisplayProps) {
  const [from, setFrom] = useState<Snapshot>({ current: currentLyrics, next: nextLyrics });
  const [displayed, setDisplayed] = useState<Snapshot>({ current: currentLyrics, next: nextLyrics });
  const [animating, setAnimating] = useState(false);

  const prevKeyRef = useRef<string | number | undefined>(animationKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animationKey === prevKeyRef.current) {
      return;
    }

    const outgoing: Snapshot = { ...displayed };
    const incoming: Snapshot = { current: currentLyrics, next: nextLyrics };

    prevKeyRef.current = animationKey;

    setFrom(outgoing);
    setAnimating(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayed(incoming);
      setAnimating(false);
    }, 650);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey]);

  return (
    <div className="shrink-0 px-4 py-3 md:px-8 md:py-4">

      <div
        className="max-w-2xl mx-auto text-center relative overflow-hidden"
        style={{ height: "5.5rem" }}
      >
        {animating ? (
          <div
            key={String(animationKey)}
            className="absolute inset-x-0"
            style={{
              top: 0,
              animation: `lyrics-scroll-up 650ms cubic-bezier(0.4, 0, 0.2, 1) both`,
              willChange: "transform",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ height: "2.75rem" }}
            >
              <ActiveLine text={from.current} />
            </div>

            <div
              className="flex items-center justify-center"
              style={{ height: "2.75rem" }}
            >
              <ActiveLine text={from.next ?? currentLyrics} animateColor />
            </div>

            <div
              className="flex items-center justify-center"
              style={{ height: "2.75rem" }}
            >
              {nextLyrics ? (
                <NextLine text={nextLyrics} />
              ) : (
                <span />
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 top-0 flex flex-col">
            <div
              className="flex items-center justify-center"
              style={{ height: "2.75rem" }}
            >
              <ActiveLine text={displayed.current} />
            </div>

            <div
              className="flex items-center justify-center"
              style={{ height: "2.75rem" }}
            >
              {displayed.next && <NextLine text={displayed.next} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveLine({ text, animateColor }: { text: string; animateColor?: boolean }) {
  return (
    <p
      className="text-lg md:text-2xl lg:text-3xl font-bold leading-snug tracking-tight w-full text-center"
      style={
        animateColor
          ? { animation: "lyrics-color-to-white 650ms cubic-bezier(0.4, 0, 0.2, 1) both" }
          : { color: "white" }
      }
    >
      {text || (
        <span className="opacity-20 italic font-normal text-slate-400 text-base">
          ··· Instrumental ···
        </span>
      )}
    </p>
  );
}

function NextLine({ text }: { text: string }) {
  return (
    <p className="text-lg md:text-2xl lg:text-3xl font-bold leading-snug tracking-tight w-full text-center text-slate-500">
      {text}
    </p>
  );
}
