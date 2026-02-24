"use client";

import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Button from "@/components/Button";
import Container from "@/components/Container";
import DrillHeader from "@/components/DrillHeader";
import SelectionBar from "@/components/SelectionBar";
import chordsData from "@/data/chords.json";
import { createChordSVG, type ChordData } from "@/utils/chordSvg";
import { playBeep, initAudio } from "@/utils/audio";
import { playChordStrum } from "@/utils/guitarAudio";
import { useWakeLock } from "@/utils/useWakeLock";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";

export default function ChordsPage() {
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [mode, setMode] = useState<"select" | "ready" | "prep" | "drill" | "finished">("select");
  const [prepCountdown, setPrepCountdown] = useState(5);
  const [drillDuration, setDrillDuration] = useState(60);
  const [drillTime, setDrillTime] = useState(60);
  const chords = chordsData.chords as ChordData[];
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const endDrill = useCallback(() => {
    releaseWakeLock();
    setMode("finished");
  }, [releaseWakeLock]);

  const backToSelect = useCallback(() => {
    releaseWakeLock();
    setMode("select");
  }, [releaseWakeLock]);

  const toggleChord = useCallback((name: string) => {
    setSelectedNames((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else if (prev.length < 8) {
        return [...prev, name];
      }
      return prev;
    });
  }, []);

  const startDrill = useCallback(() => {
    if (selectedNames.length >= 2) {
      setPrepCountdown(5);
      setDrillTime(drillDuration);
      setMode("ready");
    }
  }, [selectedNames.length, drillDuration]);

  const startPrep = useCallback(async () => {
    // Initialize audio from user gesture (required for iOS)
    await initAudio();
    // Request wake lock
    await requestWakeLock();
    setPrepCountdown(5);
    setMode("prep");
  }, [requestWakeLock]);

  const restartDrill = useCallback(async () => {
    // Initialize audio from user gesture (required for iOS)
    await initAudio();
    // Request wake lock
    await requestWakeLock();
    setPrepCountdown(5);
    setDrillTime(drillDuration);
    setMode("prep");
  }, [requestWakeLock, drillDuration]);

  const randomizeAndStart = useCallback(() => {
    // Select random number between 2-8 chords
    const count = Math.floor(Math.random() * 7) + 2;
    const shuffled = [...chords].sort(() => Math.random() - 0.5);
    const randomChords = shuffled.slice(0, count).map((c) => c.name);
    setSelectedNames(randomChords);
    setPrepCountdown(5);
    setDrillTime(drillDuration);
    setMode("ready");
  }, [chords, drillDuration]);

  const clearAll = useCallback(() => {
    setSelectedNames([]);
  }, []);

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

        // Play sound in last 5 seconds
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

  const handlePlayChord = useCallback(
    (e: React.MouseEvent, chord: ChordData) => {
      e.stopPropagation(); // Don't toggle selection when clicking play
      playChordStrum(chord, "down");
    },
    []
  );

  if (mode === "select") {
    return (
      <Container variant="page">
        {/* Navigation */}
        <Navigation subtitle="Select chords to practice" zIndex="z-40" />

        {/* Header */}
        <Container className="py-8 md:py-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Select Chords to Practice</h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl">
              Choose 2 to 8 chords, then start a drill to practice smooth transitions.
            </p>
          </div>
        </Container>

        {/* Selection Bar - Sticky */}
        <SelectionBar
          selectedItems={selectedNames.map((name) => ({ key: name, label: name }))}
          onRemove={toggleChord}
          emptyText="Select 2-8 chords to get started"
          drillDuration={drillDuration}
          onDurationChange={(t) => {
            setDrillDuration(t);
            setDrillTime(t);
          }}
          minSelections={2}
          onStartDrill={startDrill}
          onClear={clearAll}
          extraActions={
            <Button onClick={randomizeAndStart} variant="secondary-gray" size="sm" className="flex-1 md:flex-none">
              Random
            </Button>
          }
        />

        {/* Chord Grid */}
        <Container className="py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {chords.map((chord) => (
              <div
                key={chord.name}
                onClick={() => toggleChord(chord.name)}
                className={`relative block w-full group rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                  selectedNames.includes(chord.name)
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: createChordSVG(chord),
                  }}
                />
                <button
                  onClick={(e) => handlePlayChord(e, chord)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-all duration-200 cursor-pointer group/play"
                  aria-label={`Play ${chord.name} chord`}
                  title={`Play ${chord.name}`}
                >
                  <SpeakerWaveIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Container>
      </Container>
    );
  }

  // Ready phase (before starting drill)
  if (mode === "ready") {
    const selectedChords = selectedNames
      .map((name) => chords.find((c) => c.name === name))
      .filter((c): c is ChordData => c !== undefined);

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
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        {/* Header */}
        <DrillHeader mode="ready" title="Chord Transitions" onBack={backToSelect} />

        {/* Chords Grid */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <div
            className={`grid gap-3 md:gap-6 w-full max-w-6xl ${getArenaGridClass(
              selectedChords.length
            )}`}
          >
            {selectedChords.map((chord) => (
              <div
                key={chord.name}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-4 md:p-8 flex items-center justify-center hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: createChordSVG(chord, true),
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Start Button */}
          <Button onClick={startPrep} variant="primary" size="lg" className="text-xl px-12 py-6">
            Start Drill
          </Button>
        </div>
      </div>
    );
  }

  // Prep phase
  if (mode === "prep") {
    const selectedChords = selectedNames
      .map((name) => chords.find((c) => c.name === name))
      .filter((c): c is ChordData => c !== undefined);

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
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        {/* Header */}
        <DrillHeader mode="prep" title="Chord Transitions" countdown={prepCountdown} onEnd={endDrill} />

        {/* Chords Grid */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className={`grid gap-3 md:gap-6 w-full max-w-6xl ${getArenaGridClass(
              selectedChords.length
            )}`}
          >
            {selectedChords.map((chord) => (
              <div
                key={chord.name}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-4 md:p-8 flex items-center justify-center hover:shadow-blue-500/20 transition-all duration-300"
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

  // Drill phase
  if (mode === "drill") {
    const selectedChords = selectedNames
      .map((name) => chords.find((c) => c.name === name))
      .filter((c): c is ChordData => c !== undefined);

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
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        {/* Header */}
        <DrillHeader mode="drill" title="Chord Transitions" timer={drillTime} onEnd={endDrill} />

        {/* Chords Grid */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className={`grid gap-3 md:gap-6 w-full max-w-6xl ${getArenaGridClass(
              selectedChords.length
            )}`}
          >
            {selectedChords.map((chord) => (
              <div
                key={chord.name}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-4 md:p-8 flex items-center justify-center hover:shadow-blue-500/20 transition-all duration-300"
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

  // Finished phase
  if (mode === "finished") {
    const selectedChords = selectedNames
      .map((name) => chords.find((c) => c.name === name))
      .filter((c): c is ChordData => c !== undefined);

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
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        {/* Header */}
        <DrillHeader mode="finished" title="Chord Transitions" onBack={backToSelect} />

        {/* Chords Grid */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <div
            className={`grid gap-3 md:gap-6 w-full max-w-6xl ${getArenaGridClass(
              selectedChords.length
            )}`}
          >
            {selectedChords.map((chord) => (
              <div
                key={chord.name}
                className="rounded-2xl bg-white text-slate-900 shadow-2xl p-4 md:p-8 flex items-center justify-center hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: createChordSVG(chord, true),
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={restartDrill} variant="primary" size="lg" className="text-xl px-12 py-6">
              Restart Drill
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
