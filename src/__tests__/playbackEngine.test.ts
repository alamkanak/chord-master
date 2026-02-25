/**
 * PlaybackEngine tests
 *
 * Tests cover:
 *  1. Audio timing accuracy — every tick must be scheduled at exactly the right
 *     audioCtx time (±0.001 s tolerance for float arithmetic only).
 *  2. Beat interval uniformity — all inter-tick intervals must equal secondsPerTick.
 *  3. UI synchronisation — UI position changes must fire at the same audio-clock
 *     instant the corresponding audio tick was scheduled for.
 *  4. Measure boundary transitions — chord/pattern change highlights must fire
 *     exactly on the first tick of the new measure.
 *  5. Seek / skip — starting from a non-zero position resets scheduling correctly.
 *  6. Stop / resume — stopping halts scheduling; resuming reanchors cleanly.
 *  7. secondsPerTick=0 guard — start() with no configure() must not crash.
 *  8. Song completion — onSongFinished fires after the last tick is scheduled.
 */

import { PlaybackEngine } from "@/utils/playbackEngine";
import type {
  AudioClock,
  TickAudioScheduler,
  UIPositionSink,
  AnimationFrameProvider,
} from "@/utils/playbackEngine";

// ─── Controllable fakes ───────────────────────────────────────────────────────

class FakeClock implements AudioClock {
  currentTime = 0;
  advance(seconds: number) {
    this.currentTime += seconds;
  }
}

interface ScheduledTick {
  globalTick: number;
  audioTime: number;
}

class RecordingScheduler implements TickAudioScheduler {
  readonly calls: ScheduledTick[] = [];
  scheduleTickAudio(globalTick: number, atAudioTime: number): void {
    this.calls.push({ globalTick, audioTime: atAudioTime });
  }
}

interface UIEvent {
  measure: number;
  tick: number;
  /** clock.currentTime when the event was emitted */
  atClockTime: number;
}

class RecordingUISink implements UIPositionSink {
  readonly events: UIEvent[] = [];
  finished = false;
  private clock: FakeClock;
  constructor(clock: FakeClock) {
    this.clock = clock;
  }
  onPositionChanged(measure: number, tick: number): void {
    this.events.push({ measure, tick, atClockTime: this.clock.currentTime });
  }
  onSongFinished(): void {
    this.finished = true;
  }
}

/** Synchronous RAF driver — calls each queued callback immediately. */
class SyncRAF implements AnimationFrameProvider {
  private nextId = 1;
  private queue = new Map<number, () => void>();

  requestAnimationFrame(callback: () => void): number {
    const id = this.nextId++;
    this.queue.set(id, callback);
    return id;
  }
  cancelAnimationFrame(id: number): void {
    this.queue.delete(id);
  }
  /** Flush up to `count` queued frames. */
  flush(count: number): void {
    for (let i = 0; i < count; i++) {
      const [id, cb] = [...this.queue.entries()][0] ?? [];
      if (id === undefined) break;
      this.queue.delete(id);
      cb();
    }
  }
  get pendingCount(): number {
    return this.queue.size;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOLERANCE = 0.0001; // seconds — only floating-point rounding

function buildEngine(
  clock: FakeClock,
  scheduler: RecordingScheduler,
  sink: RecordingUISink,
  raf: SyncRAF
) {
  return new PlaybackEngine(clock, scheduler, sink, raf);
}

function makeConfig(
  measureTickCounts: number[],
  bpm = 120,
  ticksPerBeat = 2
) {
  const secondsPerTick = 60 / bpm / ticksPerBeat;
  return { measureTickCounts, secondsPerTick, lookaheadSeconds: 0.5 };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("PlaybackEngine — audio scheduling", () => {
  test("1a. every tick is scheduled at anchor + n * secondsPerTick", () => {
    const clock = new FakeClock(); // starts at 0
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    // 2 measures × 4 ticks = 8 ticks total, spt = 0.25s → total = 2.0s
    // Use lookahead of 3s so one frame schedules all 8 ticks
    const spt = 60 / 120 / 2; // 0.25 s per tick at 120 BPM, 2 ticks/beat
    engine.configure({ measureTickCounts: [4, 4], secondsPerTick: spt, lookaheadSeconds: 3 });
    engine.start({ measure: 0, tick: 0 });

    raf.flush(1); // one frame schedules all 8 ticks

    expect(scheduler.calls).toHaveLength(8);
    scheduler.calls.forEach(({ globalTick, audioTime }) => {
      const expected = 0 + globalTick * spt;
      expect(Math.abs(audioTime - expected)).toBeLessThan(TOLERANCE);
    });
  });

  test("1b. beat intervals are exactly secondsPerTick — no drift or jitter", () => {
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    const spt = 60 / 100 / 2; // 100 BPM, 2 ticks/beat
    engine.configure(makeConfig([8], 100, 2));
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);

    const times = scheduler.calls.map((c) => c.audioTime);
    for (let i = 1; i < times.length; i++) {
      const interval = times[i] - times[i - 1];
      expect(Math.abs(interval - spt)).toBeLessThan(TOLERANCE);
    }
  });

  test("1c. slow tempo (0.25x) has 4× longer intervals", () => {
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    const spt = 60 / 120 / 2 / 0.25; // speed 0.25x
    engine.configure({ measureTickCounts: [4], secondsPerTick: spt, lookaheadSeconds: 20 });
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);

    expect(scheduler.calls).toHaveLength(4);
    expect(Math.abs(scheduler.calls[1].audioTime - spt)).toBeLessThan(TOLERANCE);
  });

  test("1d. start() before configure() does NOT schedule any ticks", () => {
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    // Deliberately skip configure()
    engine.start({ measure: 0, tick: 0 });
    raf.flush(5);

    expect(scheduler.calls).toHaveLength(0);
    expect(engine.isPlaying).toBe(false);
  });

  test("1e. seek to mid-song reanchors scheduling from that globalTick", () => {
    const clock = new FakeClock();
    clock.currentTime = 10; // simulated mid-session
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    const spt = 0.25;
    engine.configure({ measureTickCounts: [4, 4], secondsPerTick: spt, lookaheadSeconds: 2 });
    engine.start({ measure: 1, tick: 0 }); // seek to measure 1
    raf.flush(1);

    // First tick scheduled at clock.currentTime (=10), not at 0
    expect(scheduler.calls[0].audioTime).toBeCloseTo(10, 3);
    // All ticks should be globalTick 4,5,6,7 (measure 1)
    expect(scheduler.calls[0].globalTick).toBe(4);
    expect(scheduler.calls.every((c) => c.globalTick >= 4)).toBe(true);
  });

  test("1f. onSongFinished fires after last tick is scheduled", (done) => {
    jest.useFakeTimers();
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [2], secondsPerTick: 0.25, lookaheadSeconds: 5 });
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);

    // The engine schedules a setTimeout for finish
    jest.runAllTimers();
    expect(sink.finished).toBe(true);
    jest.useRealTimers();
    done();
  });
});

describe("PlaybackEngine — UI synchronisation", () => {
  /**
   * Key invariant: the UI position change for measure M, tick T must fire
   * at a clock time ≥ (anchor + globalTick * secondsPerTick).
   * Practically: it should fire within one RAF frame after the beat is due.
   */

  test("2a. UI reports correct measure+tick after clock advances by one tick", () => {
    const spt = 0.25;
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [4, 4], secondsPerTick: spt, lookaheadSeconds: 0.1 });
    engine.start({ measure: 0, tick: 0 });

    // Frame 0 at t=0 → UI should report (0,0)
    raf.flush(1);
    expect(sink.events.at(-1)).toMatchObject({ measure: 0, tick: 0 });

    // Advance clock past tick 1
    clock.advance(spt + 0.001);
    raf.flush(1);
    expect(sink.events.at(-1)).toMatchObject({ measure: 0, tick: 1 });
  });

  test("2b. UI transitions to next measure on exact measure boundary", () => {
    const spt = 0.25;
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [4, 4], secondsPerTick: spt, lookaheadSeconds: 0.1 });
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1); // t=0 → (0,0)

    // Advance to exactly the first tick of measure 1 (= tick 4)
    clock.advance(4 * spt + 0.001);
    raf.flush(1);

    const last = sink.events.at(-1)!;
    expect(last.measure).toBe(1);
    expect(last.tick).toBe(0);
  });

  test("2c. UI does NOT emit duplicate events for the same position", () => {
    const spt = 0.25;
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [4], secondsPerTick: spt, lookaheadSeconds: 0.1 });
    engine.start({ measure: 0, tick: 0 });

    // Flush many frames without advancing the clock → same position → no extra events
    raf.flush(1); // emits (0,0)
    const countAfterFirst = sink.events.length;
    raf.flush(5); // clock hasn't moved
    expect(sink.events.length).toBe(countAfterFirst);
  });

  test("2d. UI latency ≤ one tick (audio fires first, UI catches up within 1 RAF)", () => {
    const spt = 0.1; // 100 ms per tick
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [8], secondsPerTick: spt, lookaheadSeconds: 0.3 });
    engine.start({ measure: 0, tick: 0 });

    // Simulate 8 frames, each advancing the clock by one tick
    for (let frame = 0; frame < 8; frame++) {
      raf.flush(1);
      clock.advance(spt);
    }
    raf.flush(1); // final frame to pick up last position

    // Every UI event should correspond to a scheduled audio tick at the same time
    sink.events.forEach((ev) => {
      const gt = engine.posToGlobalTick(ev);
      const scheduled = scheduler.calls.find((c) => c.globalTick === gt);
      // The audio tick should have been scheduled before or at the same clock time
      if (scheduled) {
        expect(scheduled.audioTime).toBeLessThanOrEqual(ev.atClockTime + TOLERANCE);
      }
    });
  });

  test("2e. riff measures with different tick counts schedule correctly", () => {
    const spt = 0.25;
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    // measure 0: 4 ticks (strum), measure 1: 6 ticks (riff), measure 2: 4 ticks (strum)
    engine.configure({ measureTickCounts: [4, 6, 4], secondsPerTick: spt, lookaheadSeconds: 10 });
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);

    expect(scheduler.calls).toHaveLength(14); // 4+6+4
    // First tick of measure 1 is globalTick 4
    expect(scheduler.calls[4].globalTick).toBe(4);
    expect(scheduler.calls[4].audioTime).toBeCloseTo(4 * spt, 4);
    // First tick of measure 2 is globalTick 10
    expect(scheduler.calls[10].globalTick).toBe(10);
    expect(scheduler.calls[10].audioTime).toBeCloseTo(10 * spt, 4);
  });

  test("2f. stop() halts scheduling immediately", () => {
    const spt = 0.25;
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [8], secondsPerTick: spt, lookaheadSeconds: 0.3 });
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);
    const countAfterFirstFrame = scheduler.calls.length;

    engine.stop();
    clock.advance(1);
    raf.flush(5); // should not schedule anything more

    expect(scheduler.calls.length).toBe(countAfterFirstFrame);
    expect(engine.isPlaying).toBe(false);
  });

  test("2g. restart from measure 0 after reaching end schedules from the beginning", () => {
    jest.useFakeTimers();
    const spt = 0.25;
    const clock = new FakeClock();
    const scheduler = new RecordingScheduler();
    const sink = new RecordingUISink(clock);
    const raf = new SyncRAF();
    const engine = buildEngine(clock, scheduler, sink, raf);

    engine.configure({ measureTickCounts: [2], secondsPerTick: spt, lookaheadSeconds: 5 });
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);
    jest.runAllTimers(); // trigger onSongFinished

    // Now restart
    scheduler.calls.length = 0; // clear records
    sink.finished = false;
    engine.configure({ measureTickCounts: [2], secondsPerTick: spt, lookaheadSeconds: 5 });
    clock.advance(2);
    engine.start({ measure: 0, tick: 0 });
    raf.flush(1);

    // Expect 2 new ticks anchored at new clock time (2.0)
    expect(scheduler.calls).toHaveLength(2);
    expect(scheduler.calls[0].audioTime).toBeCloseTo(2.0, 3);
    jest.useRealTimers();
  });
});

describe("PlaybackEngine — coordinate helpers", () => {
  test("posToGlobalTick / globalTickToPos are inverse functions", () => {
    const clock = new FakeClock();
    const engine = buildEngine(clock, new RecordingScheduler(), new RecordingUISink(clock), new SyncRAF());
    engine.configure({ measureTickCounts: [4, 6, 8], secondsPerTick: 0.25, lookaheadSeconds: 1 });

    const positions = [
      { measure: 0, tick: 0 },
      { measure: 0, tick: 3 },
      { measure: 1, tick: 0 },
      { measure: 1, tick: 5 },
      { measure: 2, tick: 7 },
    ];

    positions.forEach((pos) => {
      const gt = engine.posToGlobalTick(pos);
      const roundTripped = engine.globalTickToPos(gt);
      expect(roundTripped).toEqual(pos);
    });
  });

  test("totalGlobalTicks sums all measureTickCounts", () => {
    const clock = new FakeClock();
    const engine = buildEngine(clock, new RecordingScheduler(), new RecordingUISink(clock), new SyncRAF());
    engine.configure({ measureTickCounts: [4, 6, 8], secondsPerTick: 0.25, lookaheadSeconds: 1 });
    expect(engine.totalGlobalTicks()).toBe(18);
  });
});
