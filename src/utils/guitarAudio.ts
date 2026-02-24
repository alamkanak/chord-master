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

type Tick = "D" | "u" | null;

/**
 * Play a percussive preview of a strumming pattern.
 *
 * Downstrokes are rendered as a low, chunky hit (muted strum);
 * upstrokes as a brighter, thinner hit. Rests are silent.
 * Tempo defaults to 100 BPM; each tick is an eighth note.
 *
 * No chord is needed — this is purely rhythmic so the user
 * can hear the groove before practising it with real chords.
 *
 * @param ticks  – Pattern array from strumming.json
 * @param bpm    – Tempo in beats per minute (quarter note = 1 beat)
 * @param volume – Master volume 0–1 (default 0.18)
 */
export function playStrumPattern(
  ticks: Tick[],
  bpm: number = 100,
  volume: number = 0.18
): void {
  const ctx = getAudioContext();
  const eighthNoteDuration = 60 / bpm / 2; // seconds per eighth note
  const now = ctx.currentTime;

  ticks.forEach((tick, i) => {
    if (tick === null) return;

    const startTime = now + i * eighthNoteDuration;
    const isDown = tick === "D";

    // Downstroke: low muted strum (≈ 6 strings, lower pitch)
    // Upstroke: brighter partial strum (≈ top 3 strings, higher pitch)
    const baseFreq = isDown ? 196 : 330; // G3 vs E4
    const noteDuration = isDown ? 0.15 : 0.10;
    const gain = isDown ? volume : volume * 0.75;

    // Create a short percussive "chunk" using noise-like oscillators
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, startTime);
    master.gain.linearRampToValueAtTime(gain, startTime + 0.003);
    master.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    master.connect(ctx.destination);

    // Layer 1: body tone
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(baseFreq, startTime);
    osc1.frequency.exponentialRampToValueAtTime(
      baseFreq * 0.7,
      startTime + noteDuration
    );
    osc1.connect(master);
    osc1.start(startTime);
    osc1.stop(startTime + noteDuration);

    // Layer 2: attack click (higher, quieter)
    const osc2 = ctx.createOscillator();
    const clickGain = ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(baseFreq * 3, startTime);
    clickGain.gain.setValueAtTime(0.3, startTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
    osc2.connect(clickGain);
    clickGain.connect(master);
    osc2.start(startTime);
    osc2.stop(startTime + noteDuration);

    // Layer 3: subtle harmonic for realism
    const osc3 = ctx.createOscillator();
    const h3Gain = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(baseFreq * 2, startTime);
    osc3.detune.setValueAtTime(Math.random() * 6 - 3, startTime);
    h3Gain.gain.setValueAtTime(0.15, startTime);
    h3Gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + noteDuration * 0.6
    );
    osc3.connect(h3Gain);
    h3Gain.connect(master);
    osc3.start(startTime);
    osc3.stop(startTime + noteDuration);
  });
}
