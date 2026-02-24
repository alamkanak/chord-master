/**
 * Guitar chord audio synthesis using Web Audio API.
 * Uses additive synthesis with harmonics to approximate guitar timbre.
 * Reads directly from the chords.json schema.
 */

import type { ChordData } from "@/utils/chordSvg";

// Standard tuning frequencies (Hz) for each string
const STRING_FREQUENCIES: Record<number, number> = {
  6: 82.41,  // E2
  5: 110.0,  // A2
  4: 146.83, // D3
  3: 196.0,  // G3
  2: 246.94, // B3
  1: 329.63, // E4
};

let audioContext: AudioContext | null = null;

/**
 * Get or create the shared AudioContext.
 * Must be called from a user gesture the first time on iOS.
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Calculate the frequency of a string at a given fret.
 */
function getStringFrequency(stringNum: number, fret: number): number {
  const openFreq = STRING_FREQUENCIES[stringNum];
  if (!openFreq) return 0;
  return openFreq * Math.pow(2, fret / 12);
}

/**
 * Get all sounding notes for a chord as { string, frequency } pairs.
 */
function getChordFrequencies(
  chord: ChordData
): { string: number; frequency: number }[] {
  const allStrings = [6, 5, 4, 3, 2, 1];
  const fretMap = new Map<number, number>();

  for (const [stringNum, fret] of chord.fingers) {
    fretMap.set(stringNum, fret);
  }

  const notes: { string: number; frequency: number }[] = [];

  for (const s of allStrings) {
    if (chord.muted.includes(s)) continue;

    if (chord.open.includes(s)) {
      notes.push({ string: s, frequency: getStringFrequency(s, 0) });
    } else if (fretMap.has(s)) {
      notes.push({
        string: s,
        frequency: getStringFrequency(s, fretMap.get(s)!),
      });
    }
  }

  return notes;
}

/**
 * Play a single guitar-like note using additive synthesis with harmonics.
 */
function playGuitarNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number
): void {
  const harmonics = [
    { ratio: 1, gain: 1.0 },
    { ratio: 2, gain: 0.5 },
    { ratio: 3, gain: 0.25 },
    { ratio: 4, gain: 0.12 },
    { ratio: 5, gain: 0.06 },
  ];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, startTime);
  // Fast attack
  masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
  // Natural decay (guitar string)
  masterGain.gain.exponentialRampToValueAtTime(
    volume * 0.3,
    startTime + duration * 0.3
  );
  masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  masterGain.connect(ctx.destination);

  for (const harmonic of harmonics) {
    const osc = ctx.createOscillator();
    const hGain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency * harmonic.ratio, startTime);
    // Slight detune for warmth
    osc.detune.setValueAtTime(Math.random() * 4 - 2, startTime);

    hGain.gain.setValueAtTime(harmonic.gain, startTime);
    // Higher harmonics decay faster
    hGain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration * (1 / harmonic.ratio)
    );

    osc.connect(hGain);
    hGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

type StrumDirection = "down" | "up";

/**
 * Play a chord strum.
 *
 * @param chord      – Chord data from chords.json
 * @param direction  – "down" (low→high) or "up" (high→low)
 * @param strumSpeed – Seconds between each string hit (default 0.02)
 * @param duration   – Note ring duration in seconds (default 2.0)
 * @param volume     – Master volume 0–1 (default 0.15)
 */
export function playChordStrum(
  chord: ChordData,
  direction: StrumDirection = "down",
  strumSpeed: number = 0.02,
  duration: number = 2.0,
  volume: number = 0.15
): void {
  const ctx = getAudioContext();
  const notes = getChordFrequencies(chord);

  if (notes.length === 0) return;

  // down strum = 6→1 (low to high), up strum = 1→6
  const sorted =
    direction === "down"
      ? [...notes].sort((a, b) => b.string - a.string)
      : [...notes].sort((a, b) => a.string - b.string);

  const now = ctx.currentTime;

  sorted.forEach((note, index) => {
    const offset = index * strumSpeed;
    const noteVolume = volume * (0.85 + Math.random() * 0.15);
    playGuitarNote(ctx, note.frequency, now + offset, duration, noteVolume);
  });
}

/**
 * Play an individual string from a chord (for picking patterns).
 */
export function playString(
  chord: ChordData,
  stringNum: number,
  duration: number = 1.5,
  volume: number = 0.15
): void {
  if (chord.muted.includes(stringNum)) return;

  const ctx = getAudioContext();
  let fret = 0;

  if (chord.open.includes(stringNum)) {
    fret = 0;
  } else {
    const fingerEntry = chord.fingers.find(([s]) => s === stringNum);
    if (!fingerEntry) return;
    fret = fingerEntry[1];
  }

  const frequency = getStringFrequency(stringNum, fret);
  playGuitarNote(ctx, frequency, ctx.currentTime, duration, volume);
}
