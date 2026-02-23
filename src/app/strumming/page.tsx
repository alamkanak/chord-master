"use client";

import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Button from "@/components/Button";
import Container from "@/components/Container";
import DrillHeader from "@/components/DrillHeader";
import SelectionBar from "@/components/SelectionBar";
import strummingData from "@/data/strumming.json";
import { playBeep, initAudio } from "@/utils/audio";
import { useWakeLock } from "@/utils/useWakeLock";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

type Tick = "D" | "u" | null;

interface StrumPattern {
  id: string;
  name: string;
  difficulty: "beginner" | "intermediate";
  description: string;
  ticks: Tick[];
}

const BEAT_LABELS = ["1", "+", "2", "+", "3", "+", "4", "+"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function tickToDisplay(tick: Tick): string {
  if (tick === "D") return "D";
  if (tick === "u") return "u";
  return "·";
}

function PatternVisualizer({
  ticks,
  size = "md",
}: {
  ticks: Tick[];
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl md:text-5xl",
  };

  const tickSizeClasses = {
    sm: "w-8 h-14",
    md: "w-10 h-18",
    lg: "w-14 h-24 md:w-18 md:h-28",
  };

  const labelSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg md:text-xl",
  };

  const arrowSizes = {
    sm: { w: 15, h: 15 },
    md: { w: 14, h: 14 },
    lg: { w: 20, h: 20 },
  };

  return (
    <div className="flex items-end justify-center gap-0.5">
      {ticks.map((tick, i) => {
        const isDownbeat = i % 2 === 0;
        const arrow = arrowSizes[size];
        return (
          <div
            key={i}
            className={`flex flex-col items-center justify-end ${tickSizeClasses[size]}`}
          >
            <span
              className={`${sizeClasses[size]} font-bold leading-none ${
                tick === "D"
                  ? "text-blue-600"
                  : tick === "u"
                  ? "text-emerald-500"
                  : "text-slate-300"
              }`}
            >
              {tickToDisplay(tick)}
            </span>
            {/* Always reserve space for arrow to keep labels aligned */}
            <div className="mt-0.5 flex items-center justify-center" style={{ width: arrow.w, height: arrow.h }}>
              {tick && (
                tick === "D" ? (
                  <ChevronDownIcon
                    className="text-blue-400"
                    style={{ width: arrow.w, height: arrow.h }}
                  />
                ) : (
                  <ChevronUpIcon
                    className="text-emerald-400"
                    style={{ width: arrow.w, height: arrow.h }}
                  />
                )
              )}
            </div>
            <span
              className={`${labelSize[size]} mt-0.5 font-mono ${
                isDownbeat
                  ? "text-slate-500 font-semibold"
                  : "text-slate-400"
              }`}
            >
              {BEAT_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PatternBuilder({
  ticks,
  onChange,
}: {
  ticks: Tick[];
  onChange: (ticks: Tick[]) => void;
}) {
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
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
      <div className="text-sm font-medium text-slate-500 mb-4 text-center">
        Tap each beat to cycle: <span className="text-blue-600 font-bold">D</span> →{" "}
        <span className="text-emerald-500 font-bold">u</span> →{" "}
        <span className="text-slate-400">miss</span>
      </div>
      <div className="flex items-end justify-center gap-1 md:gap-2">
        {ticks.map((tick, i) => {
          const isDownbeat = i % 2 === 0;
          return (
            <button
              key={i}
              onClick={() => cycleTick(i)}
              className={`flex flex-col items-center justify-center w-10 h-18 md:w-14 md:h-22 rounded-lg border-2 transition-all duration-150 cursor-pointer active:scale-95 ${
                tick === "D"
                  ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                  : tick === "u"
                  ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100"
                  : "border-slate-200 bg-white hover:bg-slate-100"
              }`}
            >
              <span
                className={`text-xl md:text-2xl font-bold leading-none ${
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
                className={`text-sm md:text-base mt-1 font-mono ${
                  isDownbeat
                    ? "text-slate-500 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {BEAT_LABELS[i]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StrummingPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<
    "select" | "ready" | "prep" | "drill" | "finished"
  >("select");
  const [prepCountdown, setPrepCountdown] = useState(5);
  const [drillDuration, setDrillDuration] = useState(120); // 2 minutes default
  const [drillTime, setDrillTime] = useState(120);
  const [showBuilder, setShowBuilder] = useState(false);
  const [customTicks, setCustomTicks] = useState<Tick[]>([
    "D",
    null,
    "D",
    null,
    "D",
    null,
    "D",
    null,
  ]);
  const [customPatterns, setCustomPatterns] = useState<StrumPattern[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<
    "all" | "beginner" | "intermediate"
  >("all");

  const patterns = strummingData.patterns as StrumPattern[];
  const allPatterns = [...patterns, ...customPatterns];
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const filteredPatterns =
    filterDifficulty === "all"
      ? patterns
      : patterns.filter((p) => p.difficulty === filterDifficulty);

  const endDrill = useCallback(() => {
    releaseWakeLock();
    setMode("finished");
  }, [releaseWakeLock]);

  const backToSelect = useCallback(() => {
    releaseWakeLock();
    setMode("select");
  }, [releaseWakeLock]);

  const togglePattern = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((n) => n !== id);
      }
      return [...prev, id];
    });
  }, []);

  const startDrill = useCallback(() => {
    if (selectedIds.length >= 1) {
      setPrepCountdown(5);
      setDrillTime(drillDuration);
      setMode("ready");
    }
  }, [selectedIds.length, drillDuration]);

  const startPrep = useCallback(async () => {
    await initAudio();
    await requestWakeLock();
    setPrepCountdown(5);
    setMode("prep");
  }, [requestWakeLock]);

  const restartDrill = useCallback(async () => {
    await initAudio();
    await requestWakeLock();
    setPrepCountdown(5);
    setDrillTime(drillDuration);
    setMode("prep");
  }, [requestWakeLock, drillDuration]);

  const clearAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const addCustomPattern = useCallback(() => {
    // Check if pattern has at least one strum
    if (customTicks.every((t) => t === null)) return;

    const id = `custom-${Date.now()}`;
    const tickStr = customTicks
      .map((t) => (t === "D" ? "D" : t === "u" ? "u" : "·"))
      .join("");
    const newPattern: StrumPattern = {
      id,
      name: `Custom: ${tickStr}`,
      difficulty: "beginner",
      description: "Your custom strumming pattern",
      ticks: [...customTicks],
    };
    setCustomPatterns((prev) => [...prev, newPattern]);
    setSelectedIds((prev) => [...prev, id]);
    setShowBuilder(false);
    setCustomTicks(["D", null, "D", null, "D", null, "D", null]);
  }, [customTicks]);

  // Prep phase countdown
  useEffect(() => {
    if (mode !== "prep") return;

    if (prepCountdown > 0) {
      const timer = setTimeout(() => {
        setPrepCountdown(prepCountdown - 1);
        playBeep(440, 0.1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (prepCountdown === 0) {
      const timer = setTimeout(() => {
        playBeep(880, 0.2);
        setMode("drill");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mode, prepCountdown]);

  // Drill phase timer
  useEffect(() => {
    if (mode !== "drill") return;

    if (drillTime > 0) {
      const timer = setTimeout(() => {
        const nextTime = drillTime - 1;
        setDrillTime(nextTime);
        if (nextTime <= 5 && nextTime > 0) {
          playBeep(440, 0.1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (drillTime === 0) {
      const timer = setTimeout(() => {
        playBeep(523, 0.5);
        endDrill();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mode, drillTime, endDrill]);

  // SELECT MODE
  if (mode === "select") {
    return (
      <Container variant="page">
        <Navigation subtitle="Practice strumming patterns" zIndex="z-40" />

        {/* Header */}
        <Container className="py-8 md:py-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Strumming Patterns
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl">
              Choose one or more strumming patterns, set your timer, and start a
              drill to practice your rhythm.
            </p>
          </div>
        </Container>

        {/* Selection Bar - Sticky */}
        <SelectionBar
          selectedItems={selectedIds.map((id) => {
            const pat = allPatterns.find((p) => p.id === id);
            return { key: id, label: pat?.name ?? id };
          })}
          onRemove={togglePattern}
          emptyText="Select patterns to get started"
          drillDuration={drillDuration}
          onDurationChange={(t) => {
            setDrillDuration(t);
            setDrillTime(t);
          }}
          minSelections={1}
          onStartDrill={startDrill}
          onClear={clearAll}
        />

        <Container className="py-10">
          {/* Filter */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Pattern Library
            </h2>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(["all", "beginner", "intermediate"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterDifficulty(level)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    filterDifficulty === level
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {filteredPatterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => togglePattern(pattern.id)}
                className={`group text-left rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer active:scale-[0.98] hover:scale-[1.02] ${
                  selectedIds.includes(pattern.id)
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {pattern.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        pattern.difficulty === "beginner"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {pattern.difficulty}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedIds.includes(pattern.id)
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedIds.includes(pattern.id) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <PatternVisualizer ticks={pattern.ticks as Tick[]} size="sm" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {pattern.description}
                </p>
              </button>
            ))}
          </div>

          {/* Custom Patterns Section */}
          {customPatterns.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Your Custom Patterns
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customPatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => togglePattern(pattern.id)}
                    className={`group text-left rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer active:scale-[0.98] hover:scale-[1.02] ${
                      selectedIds.includes(pattern.id)
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {pattern.name}
                      </h3>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedIds.includes(pattern.id)
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-300"
                        }`}
                      >
                        {selectedIds.includes(pattern.id) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <PatternVisualizer
                      ticks={pattern.ticks as Tick[]}
                      size="sm"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pattern Builder */}
          <div className="mb-20">
            {!showBuilder ? (
              <button
                onClick={() => setShowBuilder(true)}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  ✏️
                </div>
                <div className="font-semibold text-slate-700 group-hover:text-blue-700">
                  Build Your Own Pattern
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  Create a custom strumming pattern
                </div>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-blue-200 bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Pattern Builder
                  </h2>
                  <button
                    onClick={() => setShowBuilder(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <PatternBuilder ticks={customTicks} onChange={setCustomTicks} />

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Preview:
                    <span className="ml-2 font-mono text-slate-700">
                      {customTicks
                        .map((t) =>
                          t === "D" ? "D" : t === "u" ? "u" : "·"
                        )
                        .join("")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        setCustomTicks([
                          "D",
                          null,
                          "D",
                          null,
                          "D",
                          null,
                          "D",
                          null,
                        ])
                      }
                      variant="secondary"
                      size="sm"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={addCustomPattern}
                      variant="primary"
                      size="sm"
                      disabled={customTicks.every((t) => t === null)}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Pattern
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </Container>
    );
  }

  // READY MODE
  if (mode === "ready") {
    const selectedPatterns = selectedIds
      .map((id) => allPatterns.find((p) => p.id === id))
      .filter((p): p is StrumPattern => p !== undefined);

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader mode="ready" title="Strumming Patterns" onBack={backToSelect} />

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <div className="text-center mb-4">
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">
              Duration
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {formatTime(drillDuration)}
            </div>
          </div>

          <div className="grid gap-4 w-full max-w-3xl">
            {selectedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-center mb-4">
                  {pattern.name}
                </h3>
                <PatternVisualizer
                  ticks={pattern.ticks as Tick[]}
                  size="lg"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={startPrep}
            variant="primary"
            size="lg"
            className="text-xl px-12 py-6"
          >
            Start Drill
          </Button>
        </div>
      </div>
    );
  }

  // PREP MODE
  if (mode === "prep") {
    const selectedPatterns = selectedIds
      .map((id) => allPatterns.find((p) => p.id === id))
      .filter((p): p is StrumPattern => p !== undefined);

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader mode="prep" title="Strumming Patterns" countdown={prepCountdown} onEnd={endDrill} />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="grid gap-4 w-full max-w-3xl">
            {selectedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-center mb-4">
                  {pattern.name}
                </h3>
                <PatternVisualizer
                  ticks={pattern.ticks as Tick[]}
                  size="lg"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DRILL MODE
  if (mode === "drill") {
    const selectedPatterns = selectedIds
      .map((id) => allPatterns.find((p) => p.id === id))
      .filter((p): p is StrumPattern => p !== undefined);

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader mode="drill" title="Strumming Patterns" timer={drillTime} onEnd={endDrill} />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="grid gap-4 w-full max-w-3xl">
            {selectedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-center mb-4">
                  {pattern.name}
                </h3>
                <PatternVisualizer
                  ticks={pattern.ticks as Tick[]}
                  size="lg"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // FINISHED MODE
  if (mode === "finished") {
    const selectedPatterns = selectedIds
      .map((id) => allPatterns.find((p) => p.id === id))
      .filter((p): p is StrumPattern => p !== undefined);

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader mode="finished" title="Strumming Patterns" onBack={backToSelect} />

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <div className="grid gap-4 w-full max-w-3xl">
            {selectedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-center mb-4">
                  {pattern.name}
                </h3>
                <PatternVisualizer
                  ticks={pattern.ticks as Tick[]}
                  size="lg"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={restartDrill}
              variant="primary"
              size="lg"
              className="text-xl px-12 py-6"
            >
              Restart Drill
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
