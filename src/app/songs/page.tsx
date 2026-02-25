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
import MeasureCarousel from "@/components/MeasureCarousel";
import PatternSlideshow from "@/components/PatternSlideshow";
import LyricsDisplay from "@/components/LyricsDisplay";
import type { PickingPattern } from "@/components/PickingPatternVisualizer";
import RiffDiagram from "@/components/RiffDiagram";
import songsData from "@/data/songs.json";
import { createChordSVG, type ChordData } from "@/utils/chordSvg";
import { playBeep, initAudio } from "@/utils/audio";
import { playChordStrum, playPickingBeat, playRiffNote } from "@/utils/guitarAudio";
import { useWakeLock } from "@/utils/useWakeLock";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
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
  const [isMuted, setIsMuted] = useState(false);
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

  const defaultTicksPerMeasure = selectedSong
    ? selectedSong.beatsPerMeasure * selectedSong.ticksPerBeat
    : 8;

  // Compute the number of ticks needed for a given measure.
  // For strum/picking measures, use the song's standard ticksPerMeasure.
  // For riff measures, derive from the riff's max beat * ticksPerBeat.
  const getTicksForMeasure = useCallback(
    (measureIdx: number): number => {
      if (!selectedSong) return defaultTicksPerMeasure;
      const m = flatTimeline[measureIdx];
      if (!m) return defaultTicksPerMeasure;

      if (m.type === "riff" && m.riffId) {
        const riff = selectedSong.library.riffs[m.riffId];
        if (riff && riff.notes.length > 0) {
          const maxBeat = Math.max(...riff.notes.map((n: { beat: number }) => n.beat));
          // Each beat gets ticksPerBeat ticks, so we need ceil(maxBeat) * ticksPerBeat ticks
          return Math.ceil(maxBeat) * selectedSong.ticksPerBeat;
        }
      }
      return defaultTicksPerMeasure;
    },
    [selectedSong, flatTimeline, defaultTicksPerMeasure]
  );

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

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
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
        const currentMeasureTicks = getTicksForMeasure(prev.measure);
        if (nextTick >= currentMeasureTicks) {
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
    getTicksForMeasure,
    totalMeasures,
    releaseWakeLock,
  ]);

  // ----- Audio playback synchronized with ticks -----
  useEffect(() => {
    if (mode !== "drill" || !isPlaying || !selectedSong || isMuted) return;

    const measure = flatTimeline[currentMeasureIdx];
    if (!measure) return;

    const chordLibRef = selectedSong.library.chords;
    const patternLibRef = selectedSong.library.patterns;
    const pickingPatternLibRef = selectedSong.library.pickingPatterns ?? {};
    const riffLibRef = selectedSong.library.riffs;

    const tickDuration = 60 / (selectedSong.bpm * playbackSpeed) / selectedSong.ticksPerBeat;

    if (measure.type === "strum" && measure.chordId && measure.patternId) {
      // Strum pattern: play chord strum on D/u ticks
      const pattern = patternLibRef[measure.patternId];
      const chord = chordLibRef[measure.chordId];
      if (pattern && chord && currentTick < pattern.ticks.length) {
        const tick = pattern.ticks[currentTick];
        if (tick === "D" || tick === "u") {
          const direction = tick === "D" ? "down" : "up";
          playChordStrum(
            chord as ChordData,
            direction,
            0.015,
            Math.min(tickDuration * 3, 1.5),
            0.12
          );
        }
      }
    } else if (measure.type === "picking" && measure.chordId && measure.patternId) {
      // Picking pattern: play individual strings per beat
      const pickingPattern = pickingPatternLibRef[measure.patternId];
      const chord = chordLibRef[measure.chordId];
      if (pickingPattern && chord && currentTick < pickingPattern.beats.length) {
        const beat = pickingPattern.beats[currentTick];
        playPickingBeat(
          chord as ChordData,
          beat.strings,
          Math.min(tickDuration * 2, 1.0),
          0.15
        );
      }
    } else if (measure.type === "riff" && measure.riffId) {
      // Riff: play notes whose beat aligns with the current tick
      const riff = riffLibRef[measure.riffId];
      if (riff) {
        const currentBeat = (currentTick / selectedSong.ticksPerBeat) + 1;
        const notesOnBeat = riff.notes.filter(
          (n) => Math.abs(n.beat - currentBeat) < 0.01
        );
        for (const note of notesOnBeat) {
          playRiffNote(
            note.string,
            note.fret,
            Math.min(tickDuration * 2, 1.0),
            0.15
          );
        }
      }
    }
  }, [mode, isPlaying, selectedSong, isMuted, currentMeasureIdx, currentTick, flatTimeline, playbackSpeed]);

  // ----- Lyrics: derive text from current position -----
  const liveCurrent = flatTimeline[currentMeasureIdx]?.lyrics ?? "";
  const liveNext = flatTimeline[currentMeasureIdx + 1]?.lyrics ?? "";

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
                  <div className="flex flex-wrap gap-1.5 mb-4">
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
                  <div className="flex gap-1.5 flex-wrap">
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
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-y-auto">
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
              <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPlaybackSpeed(opt.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${playbackSpeed === opt.value
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
              <div className="flex flex-wrap gap-1.5">
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
                    className="rounded-xl bg-white text-slate-900 p-3 flex items-center justify-center h-36 sm:h-40 md:h-44"
                  >
                    <div
                      className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
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
                <div className="grid gap-2">
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
                        size="lg"
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
                <div className="grid gap-2">
                  {uniquePickingPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="rounded-xl bg-white text-slate-900 p-4"
                    >
                      <h4 className="hidden sm:block text-sm font-bold text-center mb-3">
                        {pattern.name}
                      </h4>
                      <PickingPatternVisualizer
                        pattern={pattern as PickingPattern}
                        size="lg"
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
                <div className="grid gap-2">
                  {uniqueRiffs.map((riff) => (
                    <div
                      key={riff.id}
                      className="rounded-xl bg-white text-slate-900"
                    >
                      <RiffDiagram
                        riff={riff as SongRiff}
                        size="md"
                      />
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
    // Get the first measure's chord/riff and pattern
    const firstMeasure = flatTimeline[0] ?? null;
    const firstIsStrum = firstMeasure && (firstMeasure.type === "strum" || firstMeasure.type === "picking");
    const firstChord = firstIsStrum && firstMeasure.chordId ? chordLib[firstMeasure.chordId] : null;
    const firstRiff = firstMeasure && !firstIsStrum && firstMeasure.riffId ? riffLib[firstMeasure.riffId] : null;
    const firstStrumPattern = firstIsStrum && firstMeasure.patternId ? patternLib[firstMeasure.patternId] : null;
    const firstPickingPattern = firstIsStrum && firstMeasure.patternId ? pickingPatternLib[firstMeasure.patternId] : null;
    const isFirstPicking = firstIsStrum && !firstStrumPattern && !!firstPickingPattern;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-y-auto">
        <DrillHeader
          mode="prep"
          title={selectedSong.title}
          countdown={prepCountdown}
          onEnd={endDrill}
        />

        <div className="flex-1 flex flex-col items-center justify-center px-3 py-3 sm:p-6 gap-3 sm:gap-6">
          {/* Song info */}
          <div className="text-center">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
              Get Ready!
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              {selectedSong.title} — {selectedSong.artist}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
              Speed: {playbackSpeed}x ({Math.round(selectedSong.bpm * playbackSpeed)} BPM)
            </p>
          </div>

          {/* First measure chord/riff */}
          {firstChord && (
            <div className="rounded-xl sm:rounded-2xl bg-white text-slate-900 shadow-2xl p-2 sm:p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300 w-full max-w-40 sm:max-w-xs">
              <div
                className="w-full [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{
                  __html: createChordSVG(firstChord as ChordData, true),
                }}
              />
            </div>
          )}
          {firstRiff && (
            <div className="rounded-xl sm:rounded-2xl bg-white text-slate-900 shadow-2xl p-3 sm:p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300 w-full max-w-lg">
              <RiffDiagram riff={firstRiff as SongRiff} size="sm" activeBeat={null} />
            </div>
          )}

          {/* First measure pattern */}
          {firstStrumPattern && (
            <div className="rounded-xl sm:rounded-2xl bg-white text-slate-900 shadow-2xl p-3 sm:p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300 w-full max-w-lg overflow-hidden">
              <h3 className="text-sm sm:text-lg font-bold text-center mb-2 sm:mb-4">
                {firstStrumPattern.name}
              </h3>
              <PatternVisualizer ticks={firstStrumPattern.ticks as Tick[]} size="lg" />
            </div>
          )}
          {isFirstPicking && firstPickingPattern && (
            <div className="rounded-xl sm:rounded-2xl bg-white text-slate-900 shadow-2xl p-3 sm:p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300 w-full max-w-lg overflow-hidden">
              <h3 className="text-sm sm:text-lg font-bold text-center mb-2 sm:mb-4">
                {firstPickingPattern.name}
              </h3>
              <PickingPatternVisualizer
                pattern={firstPickingPattern as PickingPattern}
                size="lg"
                activeBeat={null}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============= DRILL MODE =============
  if (mode === "drill" && currentMeasure) {
    // Compute progress accounting for variable ticks per measure
    let totalTicks = 0;
    let elapsedTicks = 0;
    for (let i = 0; i < totalMeasures; i++) {
      const mt = getTicksForMeasure(i);
      totalTicks += mt;
      if (i < currentMeasureIdx) elapsedTicks += mt;
    }
    elapsedTicks += currentTick;
    const progressPercent = totalTicks > 0 ? (elapsedTicks / totalTicks) * 100 : 0;

    // Build carousel items for chord/riff display
    const chordCarouselItems = flatTimeline.map((m, i) => {
      const mIsStrum = m.type === "strum" || m.type === "picking";
      const mChord = mIsStrum && m.chordId ? chordLib[m.chordId] : null;
      const mRiff = !mIsStrum && m.riffId ? riffLib[m.riffId] : null;

      return {
        key: `chord-${i}`,
        content: mChord ? (
          <div
            className="w-full max-w-36 sm:max-w-45 [&>svg]:max-w-full [&>svg]:max-h-full"
            dangerouslySetInnerHTML={{
              __html: createChordSVG(mChord as ChordData, true),
            }}
          />
        ) : mRiff ? (
          <div className="w-full">
            <RiffDiagram
              riff={mRiff as SongRiff}
              size="sm"
              activeBeat={i === currentMeasureIdx ? (currentTick / selectedSong.ticksPerBeat) + 1 : null}
            />
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm italic">
            Instrumental
          </div>
        ),
      };
    });

    // Build pattern slideshow items
    const patternSlideshowItems = flatTimeline.map((m, i) => {
      const mIsStrum = m.type === "strum" || m.type === "picking";
      const mStrumPattern = mIsStrum && m.patternId ? patternLib[m.patternId] : null;
      const mPickingPattern = mIsStrum && m.patternId ? pickingPatternLib[m.patternId] : null;
      const mRiff = !mIsStrum && m.riffId ? riffLib[m.riffId] : null;
      const isCurrentPicking = mIsStrum && !mStrumPattern && !!mPickingPattern;

      let label = "";
      if (mStrumPattern) label = mStrumPattern.name;
      else if (mPickingPattern) label = mPickingPattern.name;
      else if (mRiff) label = mRiff.name;
      else label = "—";

      return {
        key: `pattern-${i}`,
        label,
        content: mStrumPattern ? (
          <PatternVisualizer
            ticks={mStrumPattern.ticks as Tick[]}
            size="lg"
            activeTick={i === currentMeasureIdx ? currentTick : null}
          />
        ) : isCurrentPicking && mPickingPattern ? (
          <PickingPatternVisualizer
            pattern={mPickingPattern as PickingPattern}
            size="lg"
            activeBeat={i === currentMeasureIdx ? currentTick : null}
          />
        ) : mRiff ? (
          <RiffDiagram
            riff={mRiff as SongRiff}
            size="md"
            activeBeat={i === currentMeasureIdx ? (currentTick / selectedSong.ticksPerBeat) + 1 : null}
          />
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm italic">
            No pattern
          </div>
        ),
      };
    });

    // Current section info
    const sectionLabel = currentMeasure.sectionName;
    const measureInSection = flatTimeline
      .slice(0, currentMeasureIdx + 1)
      .filter((m) => m.sectionName === sectionLabel).length;
    const totalInSection = flatTimeline.filter(
      (m) => m.sectionName === sectionLabel
    ).length;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* ─── Header ─── */}
        <DrillHeader
          mode="drill"
          title={selectedSong.title}
          onEnd={endDrill}
          hideTimer
        />

        {/* Section badge below header */}
        <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 border-b border-slate-700/30">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-xs font-bold uppercase tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {sectionLabel}
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums font-bold">
            {measureInSection}/{totalInSection}
          </span>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Lyrics Bar */}
          <LyricsDisplay
            currentLyrics={liveCurrent}
            nextLyrics={liveNext}
            animationKey={currentMeasureIdx}
          />

          {/* Chord / Riff Carousel */}
          <div className="shrink-0 py-0 sm:py-1 md:py-3">
            <MeasureCarousel
              items={chordCarouselItems}
              activeIndex={currentMeasureIdx}
            />
          </div>

          {/* Pattern / Picking / Riff Slideshow */}
          <div className="flex-1 min-h-36 sm:min-h-44 flex items-start py-2 md:py-3 overflow-hidden">
            <div className="w-full max-w-2xl mx-auto">
              <PatternSlideshow
                items={patternSlideshowItems}
                activeIndex={currentMeasureIdx}
              />
            </div>
          </div>
        </div>

        {/* ─── Bottom Controls ─── */}
        <div className="shrink-0 border-t border-white/6 bg-slate-950/80 backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto px-3 py-2.5 md:px-6 md:py-3 space-y-2.5">
            {/* Progress slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-mono text-slate-500 w-8 text-right tabular-nums">
                {currentMeasureIdx + 1}
              </span>
              <div className="flex-1 relative h-1.5 group">
                <div className="absolute inset-0 rounded-full bg-white/6" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={totalMeasures - 1}
                  value={currentMeasureIdx}
                  onChange={(e) => seekToMeasure(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-xs font-bold font-mono text-slate-500 w-8 tabular-nums">
                {totalMeasures}
              </span>
            </div>

            {/* Transport row */}
            <div className="grid grid-cols-3 items-center">
              {/* Left: Speed + Restart + Mute */}
              <div className="flex items-center gap-1.5 justify-self-start">
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="bg-white/6 text-slate-400 text-xs font-semibold rounded-lg px-2 py-1.5 border border-white/8 cursor-pointer focus:ring-1 focus:ring-blue-500/30 focus:outline-none"
                >
                  {SPEED_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => restartDrill()}
                  className="p-2 rounded-xl hover:bg-white/6 transition-colors cursor-pointer"
                  aria-label="Restart from beginning"
                >
                  <ArrowPathIcon className="h-4 w-4 text-slate-500" />
                </button>
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isMuted
                      ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                      : "hover:bg-white/6 text-slate-500"
                  }`}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="h-4 w-4" />
                  ) : (
                    <SpeakerWaveIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Center: Transport */}
              <div className="flex items-center gap-1 justify-self-center">
                <button
                  onClick={skipBackward}
                  className="p-2.5 rounded-xl hover:bg-white/6 transition-colors cursor-pointer"
                  aria-label="Previous measure"
                >
                  <BackwardIcon className="h-5 w-5 text-slate-400" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className={`p-3 rounded-2xl transition-all cursor-pointer ${isPlaying
                      ? "bg-white/8 text-amber-400 hover:bg-white/12"
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30"
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
                  className="p-2.5 rounded-xl hover:bg-white/6 transition-colors cursor-pointer"
                  aria-label="Next measure"
                >
                  <ForwardIcon className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Right: Measure info */}
              <div className="text-right justify-self-end min-w-14">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Measure
                </div>
                <div className="text-sm font-mono font-bold text-slate-300 tabular-nums">
                  {currentMeasureIdx + 1}<span className="text-slate-600">/</span>{totalMeasures}
                </div>
              </div>
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

