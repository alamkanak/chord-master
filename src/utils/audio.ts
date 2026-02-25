// Create a singleton AudioContext for iOS compatibility
let audioContext: AudioContext | null = null;
let isAudioInitialized = false;

/**
 * Initialize or resume the AudioContext.
 * Must be called from a user gesture on iOS.
 * @returns Promise<boolean> - true if successful
 */
export async function initAudio(): Promise<boolean> {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }
    
    // Resume context if suspended (iOS autoplay policy)
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    
    isAudioInitialized = audioContext.state === "running";
    return isAudioInitialized;
  } catch (error) {
    console.error("Failed to initialize audio:", error);
    return false;
  }
}

/**
 * Returns the shared AudioContext singleton, or null if initAudio() hasn't been called.
 * Used by guitarAudio.ts so both modules share the exact same context instance.
 */
export function getAudioContext(): AudioContext | null {
  return audioContext;
}

/**
 * Play a beep sound using Web Audio API.
 * Requires initAudio() to be called first from a user gesture.
 */
export function playBeep(freq: number, duration: number): void {
  try {
    if (!audioContext) {
      console.warn("Audio context not initialized. Call initAudio() from a user gesture first.");
      return;
    }

    // Check if context is suspended and try to resume
    if (audioContext.state === "suspended") {
      console.warn("Audio context suspended. Attempting to resume...");
      audioContext.resume().catch(err => console.error("Failed to resume audio:", err));
      return;
    }

    if (audioContext.state !== "running") {
      console.warn(`Audio context not running (state: ${audioContext.state})`);
      return;
    }

    const o = audioContext.createOscillator();
    const g = audioContext.createGain();
    o.connect(g);
    g.connect(audioContext.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.1, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    o.start(audioContext.currentTime);
    o.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error("Failed to play beep:", error);
  }
}
