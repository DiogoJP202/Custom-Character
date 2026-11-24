import type { RevealKind } from './gameplay.ts';
import type { Rarity } from './rarity.ts';

export const FEEDBACK_PREFERENCES_KEY = 'jjk-feedback-preferences:v1';
export interface FeedbackPreferences {
  sound: boolean;
  volume: number;
  reducedEffects: boolean;
}
export const defaultFeedback: FeedbackPreferences = {
  sound: false,
  volume: 0.35,
  reducedEffects: false,
};
export function loadFeedbackPreferences(): FeedbackPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(FEEDBACK_PREFERENCES_KEY) ?? 'null');
    if (value?.version !== 1) return { ...defaultFeedback };
    return {
      sound: value.sound === true,
      volume:
        typeof value.volume === 'number' && Number.isFinite(value.volume)
          ? Math.max(0, Math.min(1, value.volume))
          : defaultFeedback.volume,
      reducedEffects: value.reducedEffects === true,
    };
  } catch {
    return { ...defaultFeedback };
  }
}
export function saveFeedbackPreferences(preferences: FeedbackPreferences) {
  try {
    localStorage.setItem(FEEDBACK_PREFERENCES_KEY, JSON.stringify({ version: 1, ...preferences }));
  } catch {
    /* Optional feedback remains usable in memory. */
  }
}

export type AudioCue =
  | 'spin'
  | 'tick'
  | 'stop'
  | 'common'
  | 'rare'
  | 'exceptional'
  | 'chapter'
  | 'complete';
// Original, short oscillator phrases. No samples, music, noise RNG or network requests.
const scores: Record<AudioCue, readonly number[]> = {
  spin: [180, 260],
  tick: [1050],
  stop: [170],
  common: [440, 554],
  rare: [392, 587, 784],
  exceptional: [220, 440, 659, 880],
  chapter: [523, 659, 784],
  complete: [330, 440, 554, 660, 880],
};
export function revealCue(kind: RevealKind, rarity: Rarity): AudioCue {
  return kind === 'exceptional' || ['epic', 'legendary'].includes(rarity)
    ? 'exceptional'
    : kind === 'special' || ['uncommon', 'rare'].includes(rarity)
      ? 'rare'
      : 'common';
}

export function createGameAudio(factory: () => AudioContext = () => new AudioContext()) {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let preferences = { ...defaultFeedback };
  let generation = 0;
  let lastTick = -Infinity;
  let disposed = false;
  let unavailable = false;
  const voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  function clearVoices() {
    for (const voice of voices) {
      try {
        voice.oscillator.stop();
      } catch {
        /* Already ended. */
      }
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }
    voices.clear();
  }
  function stop() {
    generation++;
    clearVoices();
  }
  return {
    get unavailable() {
      return unavailable;
    },
    configure(next: FeedbackPreferences) {
      disposed = false;
      preferences = { ...next };
      if (master && context)
        master.gain.setTargetAtTime(next.volume * 0.18, context.currentTime, 0.015);
      if (!next.sound || next.volume === 0) stop();
    },
    // Only call from a user gesture (enable sound, spin, continue). Loading a save never arms audio.
    async activate() {
      if (disposed || !preferences.sound || preferences.volume === 0) return false;
      const token = generation;
      unavailable = false;
      try {
        if (!context) {
          context = factory();
          master = context.createGain();
          master.gain.value = preferences.volume * 0.18;
          master.connect(context.destination);
        }
        if (context.state === 'suspended') await context.resume();
        return (
          !disposed && token === generation && preferences.sound && context.state === 'running'
        );
      } catch {
        unavailable = true;
        return false;
      }
    },
    play(cue: AudioCue, afterStop = false) {
      if (
        disposed ||
        !preferences.sound ||
        preferences.volume === 0 ||
        context?.state !== 'running' ||
        !master
      )
        return;
      if (cue === 'tick' && context.currentTime - lastTick < 0.055) return;
      if (cue === 'tick') lastTick = context.currentTime;
      clearVoices(); // One short phrase at a time; ticks never accumulate behind a hidden tab.
      const notes = afterStop ? [170, ...scores[cue]] : scores[cue];
      const length = cue === 'tick' ? 0.012 : cue === 'spin' ? 0.045 : 0.065;
      notes.forEach((frequency, index) => {
        const oscillator = context!.createOscillator();
        const gain = context!.createGain();
        const at = context!.currentTime + index * (length + 0.018);
        oscillator.type = cue === 'tick' || cue === 'stop' ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(cue === 'tick' ? 0.3 : 0.6, at + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
        oscillator.connect(gain);
        gain.connect(master!);
        const voice = { oscillator, gain };
        voices.add(voice);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
          voices.delete(voice);
        };
        oscillator.start(at);
        oscillator.stop(at + length + 0.005);
      });
    },
    stop,
    suspend() {
      stop();
      if (context?.state === 'running') void context.suspend().catch(() => {});
    },
    dispose() {
      disposed = true;
      stop();
      master?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      context = undefined;
      master = undefined;
    },
  };
}
