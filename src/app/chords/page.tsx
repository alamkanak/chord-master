"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import chordsData from "@/data/chords.json";
import { createChordSVG } from "@/utils/chordSvg";
import { playBeep } from "@/utils/audio";

interface Chord {
  name: string;
  fingers: [number, number, number][];
  muted: number[];
  open: number[];
}

export default function ChordsPage() {
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [mode, setMode] = useState<"select" | "prep" | "drill">("select");
  const [prepCountdown, setPrepCountdown] = useState(5);
  const [drillTime, setDrillTime] = useState(60);
  const chords: Chord[] = chordsData.chords;

  // Prep phase countdown
  useEffect(() => {
    if (mode !== "prep") return;

    if (prepCountdown > 0) {
      const timer = setTimeout(() => {
        const nextCount = prepCountdown - 1;
        setPrepCountdown(nextCount);
        playBeep(440, 0.1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (prepCountdown === 0) {
      playBeep(880, 0.2);
      setMode("drill");
    }
  }, [mode, prepCountdown]);

  // Drill phase timer
  useEffect(() => {
    if (mode !== "drill") return;

    if (drillTime > 0) {
      const timer = setTimeout(() => {
        const nextTime = drillTime - 1;
        setDrillTime(nextTime);

        // Play sound in last 5 seconds
        if (nextTime <= 5 && nextTime > 0) {
          playBeep(440, 0.1);
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else if (drillTime === 0) {
      playBeep(523, 0.5);
      endDrill();
    }
  }, [mode, drillTime]);

  const toggleChord = (name: string) => {
    setSelectedNames((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else if (prev.length < 8) {
        return [...prev, name];
      }
      return prev;
    });
  };

  const startDrill = () => {
    if (selectedNames.length >= 2) {
      setPrepCountdown(5);
      setDrillTime(60);
      setMode("prep");
    }
  };

  const randomizeAndStart = () => {
    // Select random number between 2-8 chords
    const count = Math.floor(Math.random() * 7) + 2;
    const shuffled = [...chords].sort(() => Math.random() - 0.5);
    const randomChords = shuffled.slice(0, count).map((c) => c.name);
    setSelectedNames(randomChords);
    setPrepCountdown(5);
    setDrillTime(60);
    setMode("prep");
  };

  const endDrill = () => {
    setMode("select");
    setDrillTime(60);
  };

  const clearAll = () => {
    setSelectedNames([]);
  };

  // Render grid size class based on number of chords
  const getGridClass = (count: number) => {
    if (count === 0) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
    const gridMap: { [key: number]: string } = {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-2",
      5: "grid-cols-3",
      6: "grid-cols-3",
      7: "grid-cols-4",
      8: "grid-cols-4",
    };
    return gridMap[count] || "grid-cols-3";
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen w-full bg-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
              <span className="text-lg font-bold text-slate-900">Chord Master</span>
            </Link>
            <div className="text-sm font-medium text-slate-600">Chord Practice</div>
          </div>
        </nav>

        {/* Header */}
        <div className="mx-auto max-w-6xl px-6 py-4 md:py-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Select Chords</h1>
            <p className="text-slate-600">
              Pick 2 to 8 chords to practice. Then click Start Drill to begin your one-minute
              training session.
            </p>
          </div>
        </div>

        {/* Selection Bar - Sticky */}
        <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 pb-4 pt-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2" id="selected-chord-list">
                {selectedNames.length === 0 ? (
                  <span className="text-slate-400 font-medium py-2">
                    Select 2-8 chords to start
                  </span>
                ) : (
                  selectedNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleChord(name)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      {name}
                      <span className="text-lg leading-none">×</span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={clearAll}
                  className="flex-1 md:flex-none px-4 py-3 text-slate-700 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={randomizeAndStart}
                  className="flex-1 md:flex-none px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Random
                </button>
                <button
                  onClick={startDrill}
                  disabled={selectedNames.length < 2}
                  className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                >
                  Start Drill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chord Grid */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {chords.map((chord) => (
              <button
                key={chord.name}
                onClick={() => toggleChord(chord.name)}
                className={`rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                  selectedNames.includes(chord.name)
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: createChordSVG(chord),
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Prep phase
  if (mode === "prep") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="space-y-8 text-center">
          <h2 className="text-3xl font-bold">Get your guitar ready!</h2>
          <div className="text-9xl font-black text-yellow-400 tabular-nums">
            {prepCountdown}
          </div>
          <p className="text-lg text-slate-300">
            Seconds until the 1-minute drill starts
          </p>
        </div>
      </div>
    );
  }

  // Drill phase
  if (mode === "drill") {
    const selectedChords = chords.filter((c) => selectedNames.includes(c.name));

    const getArenaGridClass = (count: number) => {
      const gridMap: { [key: number]: string } = {
        2: "grid-cols-2",
        3: "grid-cols-2 sm:grid-cols-3",
        4: "grid-cols-2",
        5: "grid-cols-2 sm:grid-cols-3",
        6: "grid-cols-2 sm:grid-cols-3",
        7: "grid-cols-2 sm:grid-cols-4",
        8: "grid-cols-2 sm:grid-cols-4",
      };
      return gridMap[count] || "grid-cols-2";
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-5xl md:text-6xl font-black text-blue-400 tabular-nums">
              {String(drillTime).padStart(2, "0")}:00
            </div>
            <div className="hidden md:block text-slate-400 font-bold uppercase tracking-widest text-sm text-center flex-1">
              Practice Transitions Between All Chords
            </div>
            <button
              onClick={endDrill}
              className="px-6 py-3 bg-slate-800 hover:bg-red-600 text-white rounded-xl font-bold transition-colors flex-shrink-0 cursor-pointer"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Chords Grid */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className={`grid gap-3 md:gap-6 w-full max-w-7xl ${getArenaGridClass(
              selectedChords.length
            )}`}
          >
            {selectedChords.map((chord) => (
              <div
                key={chord.name}
                className="rounded-3xl bg-white text-slate-900 shadow-2xl p-4 md:p-8 flex items-center justify-center"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: createChordSVG(chord, true),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
