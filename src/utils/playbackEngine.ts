/**
 * PlaybackEngine — pure, framework-agnostic scheduling engine.
 *
 * Follows the Dependency Inversion Principle: it receives an
 * `AudioClock` and a `TickAudioScheduler` as injected abstractions,
 * so the engine can be unit-tested without a real AudioContext or DOM.
 *
 * Two-clock architecture (Chris Wilson pattern):
 *  • Audio clock  → AudioContext.currentTime (sample-accurate hardware clock)
 *  • UI clock     → requestAnimationFrame callback reads the audio clock
 *
 * The engine pre-schedules audio LOOKAHEAD_SECONDS ahead via the audio
 * clock, then reads that same clock in RAF to derive the current UI
 * position — guaranteeing audio and UI highlights are synchronised to
 * the same reference.
 */

// ─── Abstractions (interfaces) ───────────────────────────────────────────────

/** Provides the current audio clock time (seconds). */
export interface AudioClock {
  /** Current time in seconds (equivalent to AudioContext.currentTime). */
  readonly currentTime: number;
}

/** Called to physically schedule audio for one global tick at a precise time. */
export interface TickAudioScheduler {
  scheduleTickAudio(globalTick: number, atAudioTime: number): void;
}

/** Called by the engine to update the UI with the current playback position. */
export interface UIPositionSink {
  onPositionChanged(measure: number, tick: number): void;
  onSongFinished(): void;
}

/** Minimal RAF-like interface so tests can drive the loop synchronously. */
export interface AnimationFrameProvider {
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(id: number): void;
}

// ─── Data types ───────────────────────────────────────────────────────────────

export interface EngineConfig {
  /** Tick counts per measure (index = measure index). */
  measureTickCounts: number[];
  /** Duration of each tick in seconds. */
  secondsPerTick: number;
  /** How many seconds ahead audio should be pre-scheduled. */
  lookaheadSeconds?: number;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

const DEFAULT_LOOKAHEAD = 0.12; // seconds

export class PlaybackEngine {
  private clock: AudioClock;
  private audioScheduler: TickAudioScheduler;
  private uiSink: UIPositionSink;
  private raf: AnimationFrameProvider;

  // Engine state
  private _isPlaying = false;
  private anchorAudioTime = 0;   // clock.currentTime when seek position was set
  private seekGlobalTick = 0;    // global tick we started from
  private nextTickToSchedule = 0;
  private nextScheduledAudioTime = 0;
  private lastUIMeasure = -1;
  private lastUITick = -1;
  private rafId: number | null = null;

  // Config (updated via configure())
  private measureTickCounts: number[] = [];
  private secondsPerTick = 0;
  private lookaheadSeconds = DEFAULT_LOOKAHEAD;

  constructor(
    clock: AudioClock,
    audioScheduler: TickAudioScheduler,
    uiSink: UIPositionSink,
    raf: AnimationFrameProvider
  ) {
    this.clock = clock;
    this.audioScheduler = audioScheduler;
    this.uiSink = uiSink;
    this.raf = raf;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  configure(config: EngineConfig): void {
    this.measureTickCounts = config.measureTickCounts;
    this.secondsPerTick = config.secondsPerTick;
    this.lookaheadSeconds = config.lookaheadSeconds ?? DEFAULT_LOOKAHEAD;
  }

  /**
   * Start (or restart) playback from `pos`.
   * Must call configure() before calling start().
   */
  start(pos: { measure: number; tick: number }): void {
    this.stop();

    if (this.secondsPerTick <= 0) {
      console.warn("[PlaybackEngine] secondsPerTick not set — call configure() first");
      return;
    }

    const seekGt = this.posToGlobalTick(pos);
    const nowAudio = this.clock.currentTime;

    this.anchorAudioTime = nowAudio;
    this.seekGlobalTick = seekGt;
    this.nextTickToSchedule = seekGt;
    this.nextScheduledAudioTime = nowAudio; // schedule first tick immediately
    this.lastUIMeasure = -1;
    this.lastUITick = -1;
    this._isPlaying = true;

    this.scheduleRAF();
  }

  stop(): void {
    this._isPlaying = false;
    if (this.rafId !== null) {
      this.raf.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ── Coordinate helpers ─────────────────────────────────────────────────────

  posToGlobalTick(pos: { measure: number; tick: number }): number {
    let gt = 0;
    for (let m = 0; m < pos.measure; m++) {
      gt += this.measureTickCounts[m] ?? 0;
    }
    return gt + pos.tick;
  }

  globalTickToPos(globalTick: number): { measure: number; tick: number } {
    const counts = this.measureTickCounts;
    let remaining = globalTick;
    let measure = 0;
    while (measure < counts.length && remaining >= counts[measure]) {
      remaining -= counts[measure];
      measure++;
    }
    return { measure, tick: remaining };
  }

  totalGlobalTicks(): number {
    return this.measureTickCounts.reduce((a, b) => a + b, 0);
  }

  // ── Internal loop ──────────────────────────────────────────────────────────

  private scheduleRAF(): void {
    this.rafId = this.raf.requestAnimationFrame(() => this.tick());
  }

  /**
   * Core tick — called once per animation frame.
   * Two responsibilities:
   *   1. Pre-schedule audio for ticks within the lookahead window.
   *   2. Derive the current UI position from the audio clock.
   */
  tick(): void {
    if (!this._isPlaying) return;

    const now = this.clock.currentTime;
    const lookaheadUntil = now + this.lookaheadSeconds;
    const total = this.totalGlobalTicks();

    // ── 1. Audio lookahead scheduling ──────────────────────────────────────
    while (this.nextScheduledAudioTime < lookaheadUntil) {
      const gt = this.nextTickToSchedule;

      if (gt >= total) {
        // All ticks scheduled — wait for the last one to fire, then finish
        const finishInMs = Math.max(0, (this.nextScheduledAudioTime - now) * 1000) + 100;
        setTimeout(() => {
          this._isPlaying = false;
          this.uiSink.onSongFinished();
        }, finishInMs);
        this._isPlaying = false;
        return;
      }

      this.audioScheduler.scheduleTickAudio(gt, this.nextScheduledAudioTime);

      this.nextTickToSchedule++;
      this.nextScheduledAudioTime += this.secondsPerTick;
    }

    // ── 2. UI position sync ────────────────────────────────────────────────
    const elapsed = now - this.anchorAudioTime;
    const currentGt = Math.max(
      0,
      Math.floor(elapsed / this.secondsPerTick) + this.seekGlobalTick
    );
    const clampedGt = Math.min(currentGt, total - 1);
    const pos = this.globalTickToPos(clampedGt);

    if (pos.measure !== this.lastUIMeasure || pos.tick !== this.lastUITick) {
      this.lastUIMeasure = pos.measure;
      this.lastUITick = pos.tick;
      this.uiSink.onPositionChanged(pos.measure, pos.tick);
    }

    this.scheduleRAF();
  }
}
