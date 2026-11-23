import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, getWheelProgress, wheels } from '../data/wheels.ts';
import {
  gameReducer,
  initialState,
  loadGame,
  parseSavedGame,
  saveGame,
  STORAGE_KEY,
} from './game.ts';
import type { GameState } from './game.ts';
import { playableWheel } from './conditions.ts';

function roll(state: GameState, optionId: string): GameState {
  return gameReducer(gameReducer(state, { type: 'spin', optionId }), { type: 'reveal' });
}

function origin(nature: string, lineage = 'gojo'): GameState {
  let state = gameReducer(initialState, { type: 'start' });
  state = gameReducer(roll(state, nature), { type: 'continue' });
  if (nature === 'human') state = gameReducer(roll(state, lineage), { type: 'continue' });
  if (nature === 'human') state = gameReducer(roll(state, 'none'), { type: 'continue' });
  return state;
}

function finishPhysical(state: GameState): GameState {
  for (const id of ['strength', 'speed', 'endurance', 'energy-reserve']) {
    assert.equal(state.stepId, id);
    assert.equal(state.phase, 'ready');
    state = roll(state, wheels.find((wheel) => wheel.id === id)!.options.at(-1)!.id);
    assert.equal(state.phase, 'revealed');
    state = gameReducer(state, { type: 'continue' });
  }
  if (state.stepId === 'technique-presence')
    state = gameReducer(roll(state, 'no'), { type: 'continue' });
  for (const id of ['energy-control', 'energy-output']) {
    if (!['energy-control', 'energy-output'].includes(state.stepId)) break;
    assert.equal(state.stepId, id);
    state = gameReducer(
      roll(
        state,
        playableWheel(
          wheels.find((wheel) => wheel.id === id)!,
          state,
        ).options[0].id,
      ),
      { type: 'continue' },
    );
  }
  for (let i = 0; state.phase !== 'complete'; i++) {
    assert.ok(i < 5);
    const wheel = playableWheel(
      wheels.find((wheel) => wheel.id === state.stepId)!,
      state,
    );
    if (state.phase === 'ready') state = roll(state, wheel.options[0].id);
    assert.equal(state.phase, 'revealed');
    state = gameReducer(state, { type: 'continue' });
  }
  return state;
}

test('every human lineage passes birth conditions, physical attributes and energy', () => {
  for (const lineage of wheels.find((wheel) => wheel.id === 'lineage')!.options) {
    const chapterTwo = origin('human', lineage.id);
    assert.equal(chapterTwo.stepId, 'strength');
    assert.deepEqual(chapterTwo.results, {
      nature: 'human',
      lineage: lineage.id,
      'birth-condition': 'none',
    });
    const complete = finishPhysical(chapterTwo);
    assert.equal(complete.phase, 'complete');
    assert.equal(Object.keys(complete.results).length, 14);
    assert.equal(complete.results.lineage, lineage.id);
    assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
    assert.deepEqual(gameReducer(complete, { type: 'reset' }), { ...initialState, phase: 'ready' });
  }
});

test('all nonhuman natures skip lineage and birth and finish physical attributes and energy', () => {
  for (const nature of ['cursed-spirit', 'independent-cursed-corpse', 'simurian']) {
    const chapterTwo = origin(nature);
    assert.deepEqual(chapterTwo.results, { nature });
    const complete = finishPhysical(chapterTwo);
    assert.equal(complete.phase, 'complete');
    assert.equal(complete.stepId, nature === 'cursed-spirit' ? 'barrier-knowledge' : 'equipment');
    assert.equal(Object.keys(complete.results).length, nature === 'cursed-spirit' ? 11 : 7);
    assert.equal(complete.results.lineage, undefined);
    assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
  }
});

test('chapter and step indicators follow the catalog and conditional lineage', () => {
  const nature = wheels[0];
  const strength = wheels.find((wheel) => wheel.id === 'strength')!;
  const endurance = wheels.find((wheel) => wheel.id === 'endurance')!;
  assert.equal(getWheelProgress(nature, {}).totalSteps, 2);
  assert.equal(getWheelProgress(nature, { nature: 'simurian' }).totalSteps, 1);
  assert.deepEqual(getWheelProgress(strength, { nature: 'simurian' }), {
    chapter: chapters[2],
    chapterNumber: 3,
    stepNumber: 1,
    totalSteps: 3,
  });
  assert.equal(getWheelProgress(endurance, { nature: 'human' }).stepNumber, 3);
});

test('each stage requires a spin, a reveal and an explicit continuation; duplicate actions are inert', () => {
  let state = gameReducer(initialState, { type: 'start' });
  while (state.phase !== 'complete') {
    const wheel = playableWheel(
      wheels.find((entry) => entry.id === state.stepId)!,
      state,
    );
    assert.strictEqual(gameReducer(state, { type: 'continue' }), state);
    assert.strictEqual(gameReducer(state, { type: 'spin', optionId: 'invalid' }), state);
    const spinning = gameReducer(state, { type: 'spin', optionId: wheel.options[0].id });
    assert.equal(spinning.phase, 'spinning');
    for (const action of [
      { type: 'spin', optionId: wheel.options.at(-1)!.id },
      { type: 'continue' },
      { type: 'reset' },
    ] as const) {
      assert.strictEqual(gameReducer(spinning, action), spinning);
    }
    const revealed = gameReducer(spinning, { type: 'reveal' });
    assert.equal(revealed.stepId, state.stepId);
    assert.strictEqual(gameReducer(revealed, { type: 'reveal' }), revealed);
    assert.strictEqual(
      gameReducer(revealed, { type: 'spin', optionId: wheel.options.at(-1)!.id }),
      revealed,
    );
    state = gameReducer(revealed, { type: 'continue' });
    assert.strictEqual(gameReducer(state, { type: 'continue' }), state);
  }
});

test('cancelling any active stage returns to Natureza without results or accepting a late reveal', () => {
  for (const nature of wheels[0].options) {
    let state = gameReducer(initialState, { type: 'start' });
    for (let i = 0; state.phase !== 'complete'; i++) {
      assert.ok(i < wheels.length);
      const phases = [state];
      if (state.phase === 'ready') {
        const wheel = playableWheel(wheels.find((entry) => entry.id === state.stepId)!, state);
        const spinning = gameReducer(state, {
          type: 'spin',
          optionId: wheel.id === 'nature' ? nature.id : wheel.options[0].id,
        });
        state = gameReducer(spinning, { type: 'reveal' });
        phases.push(spinning, state);
      }
      for (const active of phases) {
        const before = JSON.stringify(active);
        const cancelled = gameReducer(active, { type: 'cancel' });
        assert.deepEqual(cancelled, initialState);
        assert.equal(JSON.stringify(active), before);
        assert.strictEqual(gameReducer(cancelled, { type: 'reveal' }), cancelled);
        assert.strictEqual(gameReducer(cancelled, { type: 'continue' }), cancelled);
        assert.deepEqual(parseSavedGame(JSON.stringify(cancelled)), initialState);
        assert.equal(gameReducer(cancelled, { type: 'start' }).phase, 'ready');
      }
      state = gameReducer(state, { type: 'continue' });
    }
    assert.strictEqual(gameReducer(state, { type: 'cancel' }), state);
  }
  assert.strictEqual(gameReducer(initialState, { type: 'cancel' }), initialState);
});

test('cancelling removes legacy flags without a random draw', () => {
  const state: GameState = {
    version: 3,
    phase: 'ready',
    stepId: 'strength',
    results: { nature: 'human', lineage: 'gojo' },
    legacyBirth: true,
  };
  const random = Math.random;
  Math.random = () => assert.fail('Cancelling must not roll a result');
  try {
    assert.deepEqual(gameReducer(state, { type: 'cancel' }), initialState);
  } finally {
    Math.random = random;
  }
});

test('all phases of human and nonhuman games restore; interrupted spins reveal the committed result', () => {
  for (const nature of wheels[0].options) {
    let state = gameReducer(initialState, { type: 'start' });
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
    while (state.phase !== 'complete') {
      const wheel = playableWheel(
        wheels.find((entry) => entry.id === state.stepId)!,
        state,
      );
      const optionId = wheel.id === 'nature' ? nature.id : wheel.options.at(-1)!.id;
      const spinning = gameReducer(state, { type: 'spin', optionId });
      const restored = parseSavedGame(JSON.stringify(spinning));
      assert.deepEqual(restored, { ...spinning, phase: 'revealed' });
      assert.strictEqual(
        gameReducer(restored, { type: 'spin', optionId: wheel.options[0].id }),
        restored,
      );
      state = gameReducer(restored, { type: 'continue' });
      assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
    }
  }
});

test('legacy origin saves enter birth for humans and physical attributes for nonhumans', () => {
  const humanResults = { nature: 'human', lineage: 'gojo' };
  assert.deepEqual(
    parseSavedGame(JSON.stringify({ phase: 'complete', stepId: 'lineage', results: humanResults })),
    { version: 3, phase: 'ready', stepId: 'birth-condition', results: humanResults },
  );
  for (const nature of ['cursed-spirit', 'independent-cursed-corpse', 'simurian']) {
    for (const phase of ['pending', 'complete']) {
      assert.deepEqual(
        parseSavedGame(JSON.stringify({ phase, stepId: 'nature', results: { nature } })),
        { version: 3, phase: 'ready', stepId: 'strength', results: { nature } },
      );
    }
  }
});

test('legacy in-progress origin saves retain their current stage and committed results', () => {
  for (const saved of [
    { phase: 'intro', stepId: 'nature', results: {} },
    { phase: 'ready', stepId: 'nature', results: {} },
    { phase: 'ready', stepId: 'lineage', results: { nature: 'human' } },
    { phase: 'revealed', stepId: 'nature', results: { nature: 'simurian' } },
    { phase: 'spinning', stepId: 'lineage', results: { nature: 'human', lineage: 'gojo' } },
  ]) {
    assert.deepEqual(parseSavedGame(JSON.stringify(saved)), {
      ...saved,
      version: 3,
      phase: saved.phase === 'spinning' ? 'revealed' : saved.phase,
    });
  }
});

test('invalid, out-of-order and unavailable saves start fresh', () => {
  const invalid = [
    null,
    '',
    'oops',
    'null',
    '{}',
    '[]',
    { phase: 'ready', stepId: 'lineage', results: {} },
    { phase: 'complete', stepId: 'lineage', results: { nature: 'human' } },
    { phase: 'revealed', stepId: 'nature', results: { nature: 'simurian', lineage: 'gojo' } },
    { phase: 'spinning', stepId: 'nature', results: { nature: 'invented' } },
    {
      version: 2,
      phase: 'revealed',
      stepId: 'strength',
      results: { nature: 'human', strength: 'toji' },
    },
    { version: 2, phase: 'ready', stepId: 'speed', results: { nature: 'simurian' } },
    {
      version: 2,
      phase: 'complete',
      stepId: 'endurance',
      results: { nature: 'simurian', strength: 'toji' },
    },
    { version: 2, phase: 'pending', stepId: 'nature', results: { nature: 'simurian' } },
    {
      version: 2,
      phase: 'revealed',
      stepId: 'strength',
      results: { nature: 'simurian', strength: 'toji', endurance: 'hanami' },
    },
    {
      version: 2,
      phase: 'revealed',
      stepId: 'nature',
      results: { nature: 'simurian', strength: 'toji' },
    },
    { version: 999, phase: 'ready', stepId: 'nature', results: {} },
  ];
  for (const value of invalid)
    assert.deepEqual(
      parseSavedGame(
        typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : (value as string | null),
      ),
      initialState,
    );
});

test('new catalog stages participate in progress, restoration and completion without parser changes', () => {
  const state = finishPhysical(origin('simurian'));
  const extra = { ...wheels.at(-1)!, id: 'future-attribute', availableWhen: undefined };
  wheels.push(extra);
  try {
    const beforeEnd = { ...state, phase: 'revealed' as const };
    const next = gameReducer(beforeEnd, { type: 'continue' });
    assert.equal(next.stepId, extra.id);
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), next);
    assert.deepEqual(parseSavedGame(JSON.stringify(next)), next);
    const complete = gameReducer(roll(next, extra.options[0].id), { type: 'continue' });
    assert.equal(complete.phase, 'complete');
    assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
  } finally {
    wheels.pop();
  }
});

test('storage round-trips versioned games and blocked storage does not interrupt play', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    const state = origin('simurian');
    saveGame(state);
    assert.equal(JSON.parse(values.get(STORAGE_KEY)!).version, 3);
    assert.deepEqual(loadGame(), state);
    const cancelled = gameReducer(state, { type: 'cancel' });
    saveGame(cancelled);
    assert.deepEqual(loadGame(), initialState);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });
    assert.deepEqual(loadGame(), initialState);
    assert.doesNotThrow(() => saveGame(state));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('test retries preserve earlier rolls and clear the selected stage and everything after it', () => {
  const complete = finishPhysical(origin('human'));
  for (const stepId of [
    'nature',
    'lineage',
    'birth-condition',
    'strength',
    'speed',
    'endurance',
    'energy-reserve',
  ]) {
    const retried = gameReducer(complete, { type: 'retry', stepId, testMode: true });
    const index = wheels.findIndex((wheel) => wheel.id === stepId);
    const expected = Object.fromEntries(
      wheels.slice(0, index).map((wheel) => [wheel.id, complete.results[wheel.id]]),
    );
    assert.equal(retried.phase, 'ready');
    assert.equal(retried.stepId, stepId);
    assert.deepEqual(retried.results, expected);
    assert.deepEqual(parseSavedGame(JSON.stringify(retried)), retried);
  }
});

test('test retries support repeated identical outcomes and changes between human and nonhuman paths', () => {
  let state = roll(gameReducer(initialState, { type: 'start' }), 'simurian');
  for (let attempt = 0; attempt < 3; attempt++) {
    state = gameReducer(state, { type: 'retry', stepId: 'nature', testMode: true });
    assert.equal(state.results.nature, undefined);
    state = roll(state, 'simurian');
    assert.equal(state.results.nature, 'simurian');
  }
  const oldHuman = finishPhysical(origin('human', 'gojo'));
  state = gameReducer(oldHuman, { type: 'retry', stepId: 'nature', testMode: true });
  state = gameReducer(roll(state, 'simurian'), { type: 'continue' });
  assert.equal(state.stepId, 'strength');
  assert.deepEqual(state.results, { nature: 'simurian' });
  state = gameReducer(state, { type: 'retry', stepId: 'nature', testMode: true });
  state = gameReducer(roll(state, 'human'), { type: 'continue' });
  assert.equal(state.stepId, 'lineage');
  assert.deepEqual(state.results, { nature: 'human' });
});

test('normal play and spinning stages reject retries; unknown or unrolled stages stay unchanged', () => {
  const revealed = roll(gameReducer(initialState, { type: 'start' }), 'human');
  assert.strictEqual(
    gameReducer(revealed, { type: 'retry', stepId: 'nature', testMode: false }),
    revealed,
  );
  assert.strictEqual(
    gameReducer(revealed, { type: 'retry', stepId: 'unknown', testMode: true }),
    revealed,
  );
  assert.strictEqual(
    gameReducer(revealed, { type: 'retry', stepId: 'lineage', testMode: true }),
    revealed,
  );
  const spinning = gameReducer(origin('human'), { type: 'spin', optionId: 'megumi' });
  assert.strictEqual(
    gameReducer(spinning, { type: 'retry', stepId: 'nature', testMode: true }),
    spinning,
  );
});
