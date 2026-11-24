import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getOption, wheels } from '../data/wheels.ts';
import { techniques } from '../data/techniques.ts';
import { revealEffects, effectForResult } from '../data/reveal-effects.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';
import { forcedOutcome, playableWheel } from './conditions.ts';
import {
  crossedSegments,
  getSegments,
  landingRotation,
  spinProgress,
  pickOption,
} from './wheel.ts';
import { rarityForProbability, resultChance } from './rarity.ts';
import {
  createGameAudio,
  defaultFeedback,
  FEEDBACK_PREFERENCES_KEY,
  loadFeedbackPreferences,
  saveFeedbackPreferences,
  revealCue,
} from './game-audio.ts';

function path(changes: Record<string, string> = {}) {
  const results = {
    nature: 'human',
    lineage: 'zenin',
    'birth-condition': 'none',
    'technique-presence': 'yes',
    'innate-technique': 'ten-shadows',
    ...changes,
  };
  let state = gameReducer(initialState, { type: 'start' });
  const states: GameState[] = [];
  for (let i = 0; state.phase !== 'complete'; i++) {
    assert.ok(i < wheels.length);
    const wheel = playableWheel(wheels.find((w) => w.id === state.stepId)!, state);
    if (state.phase === 'ready') {
      const id = results[state.stepId as keyof typeof results];
      const option = wheel.options.find((o) => o.id === id) ?? wheel.options[0];
      state = gameReducer(state, { type: 'spin', optionId: option.id });
      state = gameReducer(state, { type: 'reveal' });
    }
    states.push(state);
    state = gameReducer(state, { type: 'continue' });
  }
  return states;
}

test('rarity boundaries use the mathematical conditional probability, including exact thresholds', () => {
  for (const [probability, expected] of [
    [1, 'common'],
    [0.3, 'common'],
    [0.29999, 'uncommon'],
    [0.15, 'uncommon'],
    [0.14999, 'rare'],
    [0.05, 'rare'],
    [0.04999, 'epic'],
    [0.02, 'epic'],
    [0.01999, 'legendary'],
  ] as const)
    assert.equal(rarityForProbability(probability), expected);
  for (const p of [0, -1, NaN, Infinity, 1.1]) assert.throws(() => rarityForProbability(p));
});

test('filtered odds, rarity and rendered segments agree for every eligible nature and restriction', () => {
  for (const changes of [
    {},
    { nature: 'cursed-spirit' },
    { nature: 'simurian' },
    { nature: 'independent-cursed-corpse' },
    { 'birth-condition': 'physical-partial' },
    { 'birth-condition': 'physical-complete' },
    { 'birth-condition': 'body-limited' },
    { lineage: 'gojo', 'innate-technique': 'limitless' },
  ]) {
    for (const state of path(changes)) {
      const source = wheels.find((w) => w.id === state.stepId)!;
      const wheel = playableWheel(source, state);
      const automatic = !!forcedOutcome(source, state);
      for (const segment of getSegments(wheel.options)) {
        const chance = resultChance(wheel, segment.option.id, automatic);
        if (automatic || wheel.options.length === 1) assert.equal(chance, undefined);
        else {
          assert.equal(chance!.probability, segment.probability);
          assert.ok(Math.abs(chance!.probability - (segment.end - segment.start) / 360) < 1e-12);
          assert.equal(chance!.rarity, rarityForProbability(segment.probability));
        }
      }
    }
  }
  const state = path({ 'birth-condition': 'body-limited' }).find(
    (s) => s.stepId === 'energy-output',
  )!;
  const filtered = playableWheel(wheels.find((w) => w.id === state.stepId)!, state);
  assert.equal(filtered.options.length, 2);
  assert.equal(resultChance(filtered, 'extraordinary')!.probability, 1 / 3); // raw weight is 10, not 10%.
  assert.equal(resultChance(filtered, 'not-present'), undefined);
});

test('one physical timeline drives wheel angles and boundary clicks, without another draw or false near wins', () => {
  for (const wheel of wheels)
    for (const selected of getSegments(wheel.options)) {
      let calls = 0;
      const option = pickOption(wheel.options, () => {
        calls++;
        return selected.middle / 360;
      });
      const target = landingRotation(selected);
      for (const frames of [48, 132]) {
        let previous = 0,
          count = 0;
        for (let i = 1; i <= frames; i++) {
          const angle = target * spinProgress(i / frames);
          assert.ok(angle >= previous && angle <= target);
          count += crossedSegments(getSegments(wheel.options), previous, angle);
          previous = angle;
        }
        assert.equal(count, crossedSegments(getSegments(wheel.options), 0, target));
        assert.equal(previous, target);
      }
      assert.equal(calls, 1);
      assert.equal(option.id, selected.option.id);
      const angle = (target + selected.middle) % 360;
      assert.ok(Math.min(angle, 360 - angle) < 1e-8);
    }
  assert.equal(spinProgress(-1), 0);
  assert.equal(spinProgress(2), 1);
});

test('effect IDs cover all existing techniques, three named tools and documented domains only', () => {
  const random = Math.random;
  Math.random = () => assert.fail('visual catalog cannot sample RNG');
  try {
    for (const [key, visual] of Object.entries(revealEffects)) {
      const [step, id] = key.split('/');
      const option = getOption(step, id);
      assert.ok(option, key);
      assert.ok(visual.caption);
      assert.equal(!!visual.domain, !!option.domain);
    }
    for (const technique of techniques)
      assert.ok(effectForResult('innate-technique', technique.id));
    for (const id of ['playful-cloud', 'inverted-spear', 'soul-katana'])
      assert.ok(effectForResult('equipment', id));
    assert.equal(effectForResult('strength', 'ten-shadows'), undefined);
    assert.equal(effectForResult('domain-expansion', 'limitless'), undefined);
    for (const state of path())
      assert.deepEqual(parseSavedGame(JSON.stringify(state)).results, state.results);
  } finally {
    Math.random = random;
  }
});

test('feedback preferences are opt-in, separately versioned, bounded, and tolerate unavailable storage', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const store = new Map([
    ['jjk-spinner:v1', 'active'],
    ['jjk-character-gallery:v1', 'gallery'],
    ['jjk-spinner-preferences:v1', 'pace'],
  ]);
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
    assert.deepEqual(loadFeedbackPreferences(), defaultFeedback);
    saveFeedbackPreferences({ sound: true, volume: 0.5, reducedEffects: true });
    assert.deepEqual(loadFeedbackPreferences(), { sound: true, volume: 0.5, reducedEffects: true });
    for (const key of ['jjk-spinner:v1', 'jjk-character-gallery:v1', 'jjk-spinner-preferences:v1'])
      assert.ok(['active', 'gallery', 'pace'].includes(store.get(key)!));
    for (const raw of ['bad', 'null', '{"version":2,"sound":true}']) {
      store.set(FEEDBACK_PREFERENCES_KEY, raw);
      assert.deepEqual(loadFeedbackPreferences(), defaultFeedback);
    }
    store.set(FEEDBACK_PREFERENCES_KEY, '{"version":1,"volume":500,"sound":"true"}');
    assert.equal(loadFeedbackPreferences().volume, 1);
    assert.equal(loadFeedbackPreferences().sound, false);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    assert.deepEqual(loadFeedbackPreferences(), defaultFeedback);
    assert.doesNotThrow(() => saveFeedbackPreferences(defaultFeedback));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

class FakeAudioContext {
  state = 'suspended';
  currentTime = 0;
  destination = {};
  closes = 0;
  oscillators: {
    stops: number[];
    disconnected: number;
    start: (at: number) => void;
    stop: (at?: number) => void;
    disconnect: () => void;
    frequency: unknown;
    type: string;
    onended: unknown;
  }[] = [];
  parameter() {
    return {
      value: 0,
      setValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime() {},
    };
  }
  createGain() {
    return { gain: this.parameter(), connect() {}, disconnect() {} };
  }
  createOscillator() {
    const node = {
      stops: [] as number[],
      disconnected: 0,
      type: 'sine',
      frequency: this.parameter(),
      onended: null,
      start(_at: number) {},
      connect() {},
      stop(at = 0) {
        this.stops.push(at);
      },
      disconnect() {
        this.disconnected++;
      },
    };
    this.oscillators.push(node);
    return node;
  }
  async resume() {
    this.state = 'running';
  }
  async suspend() {
    this.state = 'suspended';
  }
  async close() {
    this.state = 'closed';
    this.closes++;
  }
}

test('original audio is lazy, explicitly armed, limited to one phrase, cancellable and releases resources', async () => {
  const context = new FakeAudioContext();
  let created = 0;
  const audio = createGameAudio(() => {
    created++;
    return context as unknown as AudioContext;
  });
  audio.configure({ ...defaultFeedback, sound: true });
  audio.play('complete');
  assert.equal(created, 0); // Restoring enabled preferences cannot make a sound.
  assert.equal(await audio.activate(), true);
  assert.equal(created, 1);
  audio.play('spin');
  const started = [...context.oscillators];
  assert.equal(started.length, 2);
  audio.play('tick');
  assert.ok(started.every((node) => node.stops.length === 2 && node.disconnected === 1));
  const count = context.oscillators.length;
  audio.play('tick');
  assert.equal(context.oscillators.length, count); // rate bounded
  context.currentTime += 0.06;
  audio.play('tick');
  assert.equal(context.oscillators.length, count + 1);
  audio.play('exceptional', true);
  audio.stop();
  assert.ok(context.oscillators.every((node) => node.disconnected >= 1));
  audio.configure({ ...defaultFeedback, sound: false });
  audio.play('rare');
  const silentCount = context.oscillators.length;
  assert.equal(await audio.activate(), false);
  assert.equal(context.oscillators.length, silentCount);
  audio.dispose();
  assert.equal(context.closes, 1);
  assert.equal(await audio.activate(), false);
});

test('cancelling a pending audio unlock prevents a late cue; missing AudioContext is nonfatal', async () => {
  const context = new FakeAudioContext();
  let resolve!: () => void;
  context.resume = () =>
    new Promise<void>((done) => {
      resolve = () => {
        context.state = 'running';
        done();
      };
    });
  const audio = createGameAudio(() => context as unknown as AudioContext);
  audio.configure({ ...defaultFeedback, sound: true });
  const pending = audio.activate();
  audio.stop();
  resolve();
  assert.equal(await pending, false);
  assert.equal(context.oscillators.length, 0);
  audio.dispose();
  const unsupported = createGameAudio(() => {
    throw new Error('unsupported');
  });
  unsupported.configure({ ...defaultFeedback, sound: true });
  assert.equal(await unsupported.activate(), false);
  assert.equal(unsupported.unavailable, true);
  assert.doesNotThrow(() => unsupported.play('complete'));
});

test('every sound cue is original synthesis and a StrictMode remount stays silent until interaction', async () => {
  const contexts: FakeAudioContext[] = [];
  const audio = createGameAudio(() => {
    const context = new FakeAudioContext();
    contexts.push(context);
    return context as unknown as AudioContext;
  });
  audio.configure({ ...defaultFeedback, sound: true });
  audio.dispose();
  audio.configure({ ...defaultFeedback, sound: true });
  assert.equal(contexts.length, 0);
  assert.equal(await audio.activate(), true);
  for (const cue of [
    'spin',
    'tick',
    'stop',
    'common',
    'rare',
    'exceptional',
    'chapter',
    'complete',
  ] as const) {
    const before = contexts[0].oscillators.length;
    audio.play(cue);
    assert.ok(contexts[0].oscillators.length > before);
  }
  audio.configure({ ...defaultFeedback, sound: true, volume: 0 });
  const before = contexts[0].oscillators.length;
  audio.play('complete');
  assert.equal(contexts[0].oscillators.length, before);
  audio.dispose();
  assert.equal(contexts[0].closes, 1);
});

test('semantic domain impact remains exceptional even with common mathematical odds', () => {
  assert.equal(revealCue('exceptional', 'common'), 'exceptional');
  assert.equal(revealCue('common', 'legendary'), 'exceptional');
  assert.equal(revealCue('special', 'common'), 'rare');
  assert.equal(revealCue('common', 'common'), 'common');
});

test('archived detail and PNG composition have no reveal effects or audio paths', () => {
  for (const file of [
    '../components/CharacterGallery.tsx',
    '../components/CharacterExportCard.tsx',
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /RevealEffect|createGameAudio|ResultMedia/);
  }
  const source = readFileSync(new URL('../components/ResultReveal.tsx', import.meta.url), 'utf8');
  const dialog = source.split('export function ResultDialog')[1];
  assert.doesNotMatch(dialog, /ResultMedia|RevealEffect|audio\.play|rarity-/);
});
