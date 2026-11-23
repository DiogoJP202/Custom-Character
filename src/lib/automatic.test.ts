import test from 'node:test';
import assert from 'node:assert/strict';
import { wheels } from '../data/wheels.ts';
import { forcedOutcome } from './conditions.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';

const physicalResults = {
  nature: 'human',
  lineage: 'zenin',
  'birth-condition': 'physical-partial',
  strength: 'todo',
  speed: 'maki-goodwill',
  endurance: 'panda',
};
const beforeEnergy: GameState = {
  version: 3,
  phase: 'revealed',
  stepId: 'endurance',
  results: physicalResults,
};

test('single-option stages register without RNG and wait for explicit continuation', () => {
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('An automatic consequence must not consume randomness');
  };
  try {
    const state = gameReducer(beforeEnergy, { type: 'continue' });
    assert.equal(state.stepId, 'energy-reserve');
    assert.equal(state.phase, 'revealed');
    assert.deepEqual(state.results, { ...physicalResults, 'energy-reserve': 'very-low' });
    assert.match(
      forcedOutcome(
        wheels.find((wheel) => wheel.id === state.stepId)!,
        state,
      )!.reason,
      /Restrição Celestial física parcial/,
    );
    for (const action of [
      { type: 'spin', optionId: 'very-low' },
      { type: 'spin', optionId: 'immense' },
      { type: 'reveal' },
      { type: 'retry', stepId: 'energy-reserve', testMode: true },
    ] as const)
      assert.strictEqual(gameReducer(state, action), state);
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
    const next = gameReducer(state, { type: 'continue' });
    assert.equal(next.phase, 'ready');
    assert.equal(next.stepId, 'technique-presence');
    assert.equal(next.results['technique-presence'], undefined);
    assert.strictEqual(gameReducer(next, { type: 'continue' }), next);
  } finally {
    Math.random = originalRandom;
  }
});

test('old ready saves enter automatic reveal; committed single-option results are preserved', () => {
  const oldReady = { ...beforeEnergy, phase: 'ready', stepId: 'energy-reserve' };
  const restored = parseSavedGame(JSON.stringify(oldReady));
  assert.equal(restored.phase, 'revealed');
  assert.deepEqual(restored.results, { ...physicalResults, 'energy-reserve': 'very-low' });
  assert.deepEqual(parseSavedGame(JSON.stringify(restored)), restored);
  for (const phase of ['spinning', 'revealed', 'complete']) {
    const old = { ...restored, phase };
    const migrated = parseSavedGame(JSON.stringify(old));
    assert.deepEqual(migrated.results, old.results);
    assert.equal(migrated.phase, phase === 'complete' ? 'ready' : 'revealed');
    assert.equal(migrated.stepId, phase === 'complete' ? 'technique-presence' : 'energy-reserve');
    assert.deepEqual(parseSavedGame(JSON.stringify(migrated)), migrated);
  }
});

test('single-option handling follows the catalog for new stages and restores their results', () => {
  const completed: GameState = {
    version: 3,
    phase: 'complete',
    stepId: 'equipment',
    results: {
      nature: 'simurian',
      strength: 'megumi',
      speed: 'megumi',
      endurance: 'panda',
      'energy-reserve': 'common',
      recovery: 'natural-recovery',
      equipment: 'none',
    },
  };
  assert.deepEqual(parseSavedGame(JSON.stringify(completed)), completed);
  const single = {
    ...wheels.at(-1)!,
    id: 'future-single',
    availableWhen: undefined,
    options: [{ ...wheels[0].options[0], id: 'only' }],
  };
  wheels.push(single);
  try {
    const state = parseSavedGame(JSON.stringify(completed));
    assert.equal(state.stepId, single.id);
    assert.equal(state.phase, 'revealed');
    assert.equal(state.results[single.id], 'only');
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
    assert.deepEqual(gameReducer({ ...completed, phase: 'revealed' }, { type: 'continue' }), state);
    const complete = gameReducer(state, { type: 'continue' });
    assert.equal(complete.phase, 'complete');
    assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
  } finally {
    wheels.pop();
  }
});

test('retrying the originating condition clears its automatic consequence and future techniques', () => {
  const complete: GameState = {
    ...beforeEnergy,
    stepId: 'innate-technique',
    phase: 'complete',
    results: {
      ...physicalResults,
      'energy-reserve': 'very-low',
      'technique-presence': 'yes',
      'innate-technique': 'ratio',
    },
  };
  const retry = gameReducer(complete, { type: 'retry', stepId: 'birth-condition', testMode: true });
  assert.deepEqual(retry.results, { nature: 'human', lineage: 'zenin' });
  assert.equal(retry.phase, 'ready');
  assert.equal(retry.stepId, 'birth-condition');
  assert.deepEqual(parseSavedGame(JSON.stringify(retry)), retry);
  const ordinary = { ...beforeEnergy, results: { ...physicalResults, 'birth-condition': 'none' } };
  const energy = gameReducer(ordinary, { type: 'continue' });
  assert.equal(energy.phase, 'ready');
  assert.equal(energy.results['energy-reserve'], undefined);
  assert.equal(
    forcedOutcome(
      wheels.find((wheel) => wheel.id === energy.stepId)!,
      energy,
    ),
    undefined,
  );
  assert.strictEqual(gameReducer(energy, { type: 'continue' }), energy);
});

test('a stale ready action cannot spin a single option before restoration', () => {
  const stale = { ...beforeEnergy, phase: 'ready' as const, stepId: 'energy-reserve' };
  assert.strictEqual(gameReducer(stale, { type: 'spin', optionId: 'very-low' }), stale);
  const incompatible = {
    ...stale,
    phase: 'revealed',
    results: { ...physicalResults, 'energy-reserve': 'immense' },
  };
  assert.strictEqual(parseSavedGame(JSON.stringify(incompatible)), initialState);
});
