"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Navigation from "@/components/Navigation";
import Button from "@/components/Button";
import Container from "@/components/Container";
import DrillHeader from "@/components/DrillHeader";
import PatternVisualizer from "@/components/PatternVisualizer";
import PickingPatternVisualizer from "@/components/PickingPatternVisualizer";
import type { PickingPattern } from "@/components/PickingPatternVisualizer";
import RiffDiagram from "@/components/RiffDiagram";
import songsData from "@/data/songs.json";
import { createChordSVG, type ChordData } from "@/utils/chordSvg";
import { playBeep, initAudio } from "@/utils/audio";
import { useWakeLock } from "@/utils/useWakeLock";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  MusicalNoteIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

// ----- Types -----

type Tick = "D" | "u" | null;

interface SongChord {
  name: string;
  fingers: [number, number, number][];
  muted: number[];
  open: number[];
}

interface SongPattern {
  id: string;
  name: string;
  ticks: Tick[];
}

interface PickingBeat {
  strings: number[];
  fingers?: string[];
}

interface SongPickingPattern {
  id: string;
  name: string;
  beats: PickingBeat[];
}

interface RiffNote {
  string: number;
  fret: number;
  beat: number;
}

interface SongRiff {
  id: string;
  name: string;
  description: string;
  tuning: string[];
  notes: RiffNote[];
}

interface StrumMeasure {
  type: "strum";
  chordId: string;
  patternId: string;
  lyrics: string;
}

interface PickingMeasure {
  type: "picking";
  chordId: string;
  patternId: string;
  lyrics: string;
}

interface RiffMeasure {
  type: "riff";
  riffId: string;
  lyrics: string;
}

type Measure = StrumMeasure | PickingMeasure | RiffMeasure;

interface TimelineSection {
  section: string;
  measures: Measure[];
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  difficulty: string;
  capo: number;
  bpm: number;
  beatsPerMeasure: number;
  ticksPerBeat: number;
  description: string;
  tips: string[];
  library: {
    chords: Record<string, SongChord>;
    patterns: Record<string, SongPattern>;
    pickingPatterns?: Record<string, SongPickingPattern>;
    riffs: Record<string, SongRiff>;
  };
  timeline: TimelineSection[];
}

interface FlatMeasure {
  sectionName: string;
  sectionIdx: number;
  type: "strum" | "picking" | "riff";
  chordId?: string;
  patternId?: string;
  riffId?: string;
  lyrics: string;
}

const SPEED_OPTIONS = [
  { label: "0.1x", value: 0.1 },
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1x", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
];

// ----- Main Page Component -----

export default function SongsPage() {
  const songs = songsData.songs as unknown as Song[];
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [mode, setMode] = useState<
    "select" | "ready" | "prep" | "drill" | "finished"
  >("select");
  const [prepCountdown, setPrepCountdown] = useState(5);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  // Use a single position state to avoid nested setState bugs
  const [playbackPos, setPlaybackPos] = useState({ measure: 0, tick: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const currentMeasureIdx = playbackPos.measure;
  const currentTick = playbackPos.tick;

  const selectedSong = songs.find((s) => s.id === selectedSongId) ?? null;

  // Flatten all measures from all sections
  const flatTimeline: FlatMeasure[] = useMemo(() => {
    if (!selectedSong) return [];
    return selectedSong.timeline.flatMap((section, sIdx) =>
      section.measures.map((m) => ({
        ...m,
        sectionName: section.section,
        sectionIdx: sIdx,
      }))
    );
  }, [selectedSong]);

  const totalMeasures = flatTimeline.length;
  const currentMeasure = flatTimeline[currentMeasureIdx] ?? null;
  const nextMeasure = flatTimeline[currentMeasureIdx + 1] ?? null;

  const ticksPerMeasure = selectedSong
    ? selectedSong.beatsPerMeasure * selectedSong.ticksPerBeat
    : 8;

  // ----- Callbacks -----

  const endDrill = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    releaseWakeLock();
    setMode("finished");
  }, [releaseWakeLock]);

  const backToSelect = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    releaseWakeLock();
    setMode("select");
    setPlaybackPos({ measure: 0, tick: 0 });
  }, [releaseWakeLock]);

  const startPrep = useCallback(async () => {
    await initAudio();
    await requestWakeLock();
    setPrepCountdown(5);
    setPlaybackPos({ measure: 0, tick: 0 });
    setIsPlaying(false);
    setMode("prep");
  }, [requestWakeLock]);

  const restartDrill = useCallback(async () => {
    await initAudio();
    await requestWakeLock();
    setPrepCountdown(5);
    setPlaybackPos({ measure: 0, tick: 0 });
    setIsPlaying(false);
    setMode("prep");
  }, [requestWakeLock]);

  const selectSong = useCallback((id: string) => {
    setSelectedSongId(id);
    setMode("ready");
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const skipForward = useCallback(() => {
    setPlaybackPos((prev) => {
      if (prev.measure >= totalMeasures - 1) return prev;
      return { measure: prev.measure + 1, tick: 0 };
    });
  }, [totalMeasures]);

  const skipBackward = useCallback(() => {
    setPlaybackPos((prev) => {
      if (prev.measure <= 0) return { measure: 0, tick: 0 };
      return { measure: prev.measure - 1, tick: 0 };
    });
  }, []);

  const seekToMeasure = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < totalMeasures) {
        setPlaybackPos({ measure: idx, tick: 0 });
      }
    },
    [totalMeasures]
  );

  // ----- Prep countdown effect -----
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
        setIsPlaying(true);
        setMode("drill");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mode, prepCountdown]);

  // ----- Playback tick effect -----
  useEffect(() => {
    if (mode !== "drill" || !isPlaying || !selectedSong) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const msPerTick =
      60000 / selectedSong.bpm / selectedSong.ticksPerBeat / playbackSpeed;

    intervalRef.current = setInterval(() => {
      setPlaybackPos((prev) => {
        const nextTick = prev.tick + 1;
        if (nextTick >= ticksPerMeasure) {
          // Move to next measure
          const nextMeasure = prev.measure + 1;
          if (nextMeasure >= totalMeasures) {
            // Song finished — schedule side effects outside updater
            setTimeout(() => {
              setIsPlaying(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
              releaseWakeLock();
              setMode("finished");
            }, 0);
            return prev;
          }
          return { measure: nextMeasure, tick: 0 };
        }
        return { measure: prev.measure, tick: nextTick };
      });
    }, msPerTick);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    mode,
    isPlaying,
    selectedSong,
    playbackSpeed,
    ticksPerMeasure,
    totalMeasures,
    releaseWakeLock,
  ]);

  // ----- Helper: get unique chords for a song -----
  const getSongChords = (song: Song): string[] => {
    const chordSet = new Set<string>();
    song.timeline.forEach((section) => {
      section.measures.forEach((m) => {
        if ((m.type === "strum" || m.type === "picking") && (m as StrumMeasure | PickingMeasure).chordId) {
          chordSet.add((m as StrumMeasure | PickingMeasure).chordId);
        }
      });
    });
    return Array.from(chordSet);
  };

  // ============= SELECT MODE =============
  if (mode === "select") {
    return (
      <Container variant="page">
        <Navigation subtitle="Practice songs" zIndex="z-40" />

        <Container className="py-8 md:py-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Song Practice
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl">
              Learn to play real songs with guided chord changes, strumming
              patterns, and riffs. Follow along at your own speed.
            </p>
          </div>
        </Container>

        <Container className="py-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {songs.map((song) => {
              const chords = getSongChords(song);
              const totalMeasures = song.timeline.reduce(
                (acc, s) => acc + s.measures.length,
                0
              );
              const hasRiffs = song.timeline.some((s) =>
                s.measures.some((m) => m.type === "riff")
              );

              return (
                <button
                  key={song.id}
                  onClick={() => selectSong(song.id)}
                  className="group text-left rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {song.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {song.artist} • {song.album}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${song.difficulty === "beginner"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : song.difficulty === "intermediate"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    >
                      {song.difficulty}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {song.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {chords.length} Chords
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {totalMeasures} Measures
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {song.bpm} BPM
                    </span>
                    {hasRiffs && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Riffs
                      </span>
                    )}
                    {song.capo > 0 && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        Capo {song.capo}
                      </span>
                    )}
                  </div>

                  {/* Chord preview */}
                  <div className="flex gap-2 flex-wrap">
                    {chords.map((chordName) => (
                      <span
                        key={chordName}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700"
                      >
                        {chordName}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Container>
      </Container>
    );
  }

  // Guard: need a selected song for remaining modes
  if (!selectedSong) return null;

  const chordLib = selectedSong.library.chords;
  const patternLib = selectedSong.library.patterns;
  const pickingPatternLib = selectedSong.library.pickingPatterns ?? {};
  const riffLib = selectedSong.library.riffs;

  // ============= READY MODE =============
  if (mode === "ready") {
    const uniqueChords = Object.values(chordLib);
    const uniquePatterns = Object.values(patternLib);
    const uniquePickingPatterns = Object.values(pickingPatternLib);
    const uniqueRiffs = Object.values(riffLib);
    const sections = selectedSong.timeline.map((s) => s.section);

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader
          mode="ready"
          title={selectedSong.title}
          onBack={backToSelect}
        />

        <div className="flex-1 px-4 py-6 md:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Song Info */}
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold">
                {selectedSong.title}
              </h2>
              <p className="text-slate-400 mt-1">
                {selectedSong.artist} • {selectedSong.bpm} BPM
              </p>
            </div>

            {/* Speed Selector */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Playback Speed
              </span>
              <div className="flex gap-2">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPlaybackSpeed(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${playbackSpeed === opt.value
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Effective BPM:{" "}
                <span className="font-bold text-blue-400">
                  {Math.round(selectedSong.bpm * playbackSpeed)}
                </span>
              </p>
            </div>

            {/* Sections Overview */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Song Structure
              </h3>
              <div className="flex flex-wrap gap-2">
                {sections.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Chords Used */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Chords Used ({uniqueChords.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {uniqueChords.map((chord) => (
                  <div
                    key={chord.name}
                    className="rounded-xl bg-white text-slate-900 p-4 flex items-center justify-center"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: createChordSVG(chord as ChordData),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Strumming Patterns Used */}
            {uniquePatterns.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Strumming Patterns
                </h3>
                <div className="grid gap-3">
                  {uniquePatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="rounded-xl bg-white text-slate-900 p-4"
                    >
                      <h4 className="text-sm font-bold text-center mb-3">
                        {pattern.name}
                      </h4>
                      <PatternVisualizer
                        ticks={pattern.ticks as Tick[]}
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Picking Patterns Used */}
            {uniquePickingPatterns.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Picking Patterns
                </h3>
                <div className="grid gap-3">
                  {uniquePickingPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="rounded-xl bg-white text-slate-900 p-4"
                    >
                      <h4 className="text-sm font-bold text-center mb-3">
                        {pattern.name}
                      </h4>
                      <PickingPatternVisualizer
                        pattern={pattern as PickingPattern}
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Riffs Used */}
            {uniqueRiffs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Riffs
                </h3>
                <div className="grid gap-3">
                  {uniqueRiffs.map((riff) => (
                    <div
                      key={riff.id}
                      className="rounded-xl bg-white text-slate-900"
                    >
                      <RiffDiagram riff={riff as SongRiff} size="md" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {selectedSong.tips.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Practice Tips
                </h3>
                <ul className="space-y-2">
                  {selectedSong.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-slate-300"
                    >
                      <span className="text-blue-400 shrink-0">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start Button */}
            <div className="flex justify-center pt-4 pb-8">
              <Button
                onClick={startPrep}
                variant="primary"
                size="lg"
                className="text-xl px-12 py-6"
              >
                Start Practice
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= PREP MODE =============
  if (mode === "prep") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader
          mode="prep"
          title={selectedSong.title}
          countdown={prepCountdown}
          onEnd={endDrill}
        />

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center">
            <MusicalNoteIcon className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Get Ready!
            </h2>
            <p className="text-slate-400">
              {selectedSong.title} — {selectedSong.artist}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Speed: {playbackSpeed}x ({Math.round(selectedSong.bpm * playbackSpeed)} BPM)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============= DRILL MODE =============
  if (mode === "drill" && currentMeasure) {
    const progressPercent =
      ((currentMeasureIdx * ticksPerMeasure + currentTick) /
        (totalMeasures * ticksPerMeasure)) *
      100;

    // Current content
    const isStrum = currentMeasure.type === "strum" || currentMeasure.type === "picking";
    const currentChord = isStrum
      ? chordLib[currentMeasure.chordId!]
      : null;
    const currentStrumPattern = isStrum && currentMeasure.patternId
      ? patternLib[currentMeasure.patternId]
      : null;
    const currentPickingPattern = isStrum && currentMeasure.patternId
      ? pickingPatternLib[currentMeasure.patternId]
      : null;
    // A "strum" measure is either a strum pattern or a picking pattern
    const isPicking = isStrum && !currentStrumPattern && !!currentPickingPattern;
    const currentPattern = currentStrumPattern;
    const currentRiff =
      !isStrum && currentMeasure.riffId
        ? riffLib[currentMeasure.riffId]
        : null;

    // Next content
    const nextIsStrum = nextMeasure?.type === "strum" || nextMeasure?.type === "picking";
    const nextChord = nextIsStrum && nextMeasure?.chordId
      ? chordLib[nextMeasure.chordId]
      : null;
    const nextRiffData =
      nextMeasure && !nextIsStrum && nextMeasure.riffId
        ? riffLib[nextMeasure.riffId]
        : null;

    // Active beat for riff or picking highlighting
    const activeBeat = !isStrum
      ? (currentTick / selectedSong.ticksPerBeat) + 1
      : null;
    const activePickingBeat = isPicking ? currentTick : null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Compact Drill Header */}
        <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
          <div className="px-3 py-2 md:px-6 md:py-3">
            <div className="flex items-center justify-between gap-2 min-h-10">
              {/* Back */}
              <Button
                onClick={endDrill}
                variant="icon"
                size="sm"
                aria-label="End drill"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>

              {/* Section label */}
              <div className="flex flex-col items-center min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  {currentMeasure.sectionName}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-48">
                  {selectedSong.title}
                </span>
              </div>

              {/* Speed badge */}
              <span className="text-[10px] font-bold bg-slate-700/60 px-2 py-1 rounded-full text-slate-300">
                {playbackSpeed}x
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
            {/* Lyrics */}
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4 md:p-6 min-h-25 flex flex-col justify-center items-center text-center">
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed">
                {currentMeasure.lyrics || (
                  <span className="opacity-30 italic font-normal text-slate-400">
                    ··· Instrumental ···
                  </span>
                )}
              </p>
              {nextMeasure && nextMeasure.lyrics && (
                <p className="text-sm text-slate-500 mt-3">
                  {nextMeasure.lyrics}
                </p>
              )}
            </div>

            {/* Performance Content */}
            {isPicking && currentChord && currentPickingPattern ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Chord */}
                <div className="rounded-2xl bg-white text-slate-900 p-4 md:p-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                    Current Chord
                  </div>
                  <div
                    className="max-w-48 mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: createChordSVG(
                        currentChord as ChordData,
                        true
                      ),
                    }}
                  />
                </div>

                {/* Next Chord */}
                <div className="rounded-2xl bg-white text-slate-900 p-4 md:p-6 flex flex-col">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                    {nextMeasure ? "Up Next" : "Last Measure"}
                  </div>
                  {nextChord ? (
                    <div className="max-w-48 mx-auto">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: createChordSVG(
                            nextChord as ChordData,
                            true
                          ),
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-sm text-slate-400 italic">
                        End of song
                      </span>
                    </div>
                  )}

                  {nextMeasure && (
                    <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Change in
                      </span>
                      <span className="text-sm font-mono font-bold text-blue-600">
                        {ticksPerMeasure - currentTick} ticks
                      </span>
                    </div>
                  )}
                </div>

                {/* Picking Pattern — full width below */}
                <div className="md:col-span-2 rounded-2xl bg-white text-slate-900 p-4 md:p-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                    Picking Pattern — {currentPickingPattern.name}
                  </div>
                  <PickingPatternVisualizer
                    pattern={currentPickingPattern as PickingPattern}
                    size="lg"
                    activeBeat={activePickingBeat}
                  />
                </div>
              </div>
            ) : isStrum && currentChord && currentPattern ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Chord */}
                <div className="rounded-2xl bg-white text-slate-900 p-4 md:p-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                    Current Chord
                  </div>
                  <div
                    className="max-w-48 mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: createChordSVG(
                        currentChord as ChordData,
                        true
                      ),
                    }}
                  />
                </div>

                {/* Next Chord or Next Info */}
                <div className="rounded-2xl bg-white text-slate-900 p-4 md:p-6 flex flex-col">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                    {nextMeasure ? "Up Next" : "Last Measure"}
                  </div>
                  {nextChord ? (
                    <div className="max-w-48 mx-auto">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: createChordSVG(
                            nextChord as ChordData,
                            true
                          ),
                        }}
                      />
                    </div>
                  ) : nextRiffData ? (
                    <div className="rounded-2xl bg-white text-slate-900">
                      <RiffDiagram
                        riff={nextRiffData as SongRiff}
                        size="sm"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-sm text-slate-400 italic">
                        End of song
                      </span>
                    </div>
                  )}

                  {/* Ticks until change */}
                  {nextMeasure && (
                    <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Change in
                      </span>
                      <span className="text-sm font-mono font-bold text-blue-600">
                        {ticksPerMeasure - currentTick} ticks
                      </span>
                    </div>
                  )}
                </div>

                {/* Strumming Pattern — full width below */}
                <div className="md:col-span-2 rounded-2xl bg-white text-slate-900 p-4 md:p-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                    Strumming Pattern — {currentPattern.name}
                  </div>
                  <PatternVisualizer
                    ticks={currentPattern.ticks as Tick[]}
                    size="lg"
                    activeTick={currentTick}
                  />
                </div>
              </div>
            ) : currentRiff ? (
              <div className="space-y-4">
                {/* Riff display */}
                <div className="rounded-2xl bg-white text-slate-900">
                  <RiffDiagram
                    riff={currentRiff as SongRiff}
                    size="lg"
                    activeBeat={activeBeat}
                  />
                </div>

                {/* Next up */}
                {nextMeasure && (
                  <div className="rounded-2xl bg-white text-slate-900 p-4 md:p-6">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                      Up Next
                    </div>
                    {nextChord ? (
                      <div className="max-w-48 mx-auto">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: createChordSVG(
                              nextChord as ChordData
                            ),
                          }}
                        />
                      </div>
                    ) : nextRiffData ? (
                      <div className="rounded-2xl bg-white text-slate-900">
                        <RiffDiagram
                          riff={nextRiffData as SongRiff}
                          size="sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic block text-center">
                        End of song
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-3 py-3 md:px-6 md:py-4 space-y-3">
            {/* Progress slider */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                {currentMeasureIdx + 1}
              </span>
              <input
                type="range"
                min={0}
                max={totalMeasures - 1}
                value={currentMeasureIdx}
                onChange={(e) => seekToMeasure(Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8">
                {totalMeasures}
              </span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between">
              {/* Speed control */}
              <div className="flex items-center gap-2">
                <select
                  value={playbackSpeed}
                  onChange={(e) =>
                    setPlaybackSpeed(Number(e.target.value))
                  }
                  className="bg-slate-700/60 text-slate-300 text-xs font-semibold rounded-lg px-2 py-1.5 border border-slate-600/50 cursor-pointer"
                >
                  {SPEED_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    restartDrill();
                  }}
                  className="p-2 rounded-full hover:bg-slate-700/50 transition-colors cursor-pointer"
                  aria-label="Restart from beginning"
                >
                  <ArrowPathIcon className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              {/* Transport controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={skipBackward}
                  className="p-2.5 rounded-full hover:bg-slate-700/50 transition-colors cursor-pointer"
                  aria-label="Previous measure"
                >
                  <BackwardIcon className="h-5 w-5 text-slate-300" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className={`p-3.5 rounded-full transition-all cursor-pointer ${isPlaying
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <PauseIcon className="h-6 w-6" />
                  ) : (
                    <PlayIcon className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={skipForward}
                  className="p-2.5 rounded-full hover:bg-slate-700/50 transition-colors cursor-pointer"
                  aria-label="Next measure"
                >
                  <ForwardIcon className="h-5 w-5 text-slate-300" />
                </button>
              </div>

              {/* Measure info */}
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Measure
                </div>
                <div className="text-sm font-mono font-bold text-slate-300">
                  {currentMeasureIdx + 1}/{totalMeasures}
                </div>
              </div>
            </div>

            {/* Progress bar visual */}
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= FINISHED MODE =============
  if (mode === "finished") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
        <DrillHeader
          mode="finished"
          title={selectedSong.title}
          onBack={backToSelect}
        />

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Great Practice!
            </h2>
            <p className="text-slate-400">
              {selectedSong.title} — {selectedSong.artist}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Speed: {playbackSpeed}x ({Math.round(selectedSong.bpm * playbackSpeed)} BPM)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => {
                setPlaybackPos({ measure: 0, tick: 0 });
                setIsPlaying(false);
                setMode("ready");
              }}
              variant="primary"
              size="lg"
              className="text-xl px-12 py-6"
            >
              Practice Again
            </Button>
            <Button
              onClick={backToSelect}
              variant="secondary-dark"
              size="lg"
              className="text-xl px-12 py-6"
            >
              Choose Song
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
