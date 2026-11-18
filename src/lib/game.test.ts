import test from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer, initialState, parseSavedGame } from './game.ts';
import type { GameState } from './game.ts';

function spinNature(optionId: string): GameState {
  let state = gameReducer(initialState, { type: 'start' });
  state = gameReducer(state, { type: 'spin', optionId });
  return gameReducer(state, { type: 'reveal' });
}

test('human creation progresses through lineage and ends with both results', () => {
  let state = spinNature('human');
  state = gameReducer(state, { type: 'continue' });
  assert.equal(state.stepId, 'lineage');
  assert.equal(state.phase, 'ready');
  state = gameReducer(state, { type: 'spin', optionId: 'gojo' });
  state = gameReducer(state, { type: 'reveal' });
  state = gameReducer(state, { type: 'continue' });
  assert.equal(state.phase, 'complete');
  assert.deepEqual(state.results, { nature: 'human', lineage: 'gojo' });
  state = gameReducer(state, { type: 'reset' });
  assert.deepEqual(state, { ...initialState, phase: 'ready' });
});

test('each nonhuman nature reaches its pending screen and partial sheet without lineage', () => {
  for (const nature of ['cursed-spirit', 'independent-cursed-corpse', 'simurian']) {
    let state = gameReducer(spinNature(nature), { type: 'continue' });
    assert.equal(state.phase, 'pending');
    assert.deepEqual(state.results, { nature });
    state = gameReducer(state, { type: 'finish' });
    assert.equal(state.phase, 'complete');
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  }
});

test('rapid duplicate spins, repeated completion, early continuation and invalid actions are ignored', () => {
  const ready = gameReducer(initialState, { type: 'start' });
  assert.strictEqual(gameReducer(ready, { type: 'continue' }), ready);
  assert.strictEqual(gameReducer(ready, { type: 'spin', optionId: 'invalid' }), ready);
  const spinning = gameReducer(ready, { type: 'spin', optionId: 'human' });
  assert.strictEqual(gameReducer(spinning, { type: 'spin', optionId: 'simurian' }), spinning);
  assert.strictEqual(gameReducer(spinning, { type: 'continue' }), spinning);
  assert.strictEqual(gameReducer(spinning, { type: 'reset' }), spinning);
  const revealed = gameReducer(spinning, { type: 'reveal' });
  assert.strictEqual(gameReducer(revealed, { type: 'reveal' }), revealed);
  assert.strictEqual(gameReducer(revealed, { type: 'spin', optionId: 'simurian' }), revealed);
});

test('reload during animation restores the committed outcome as revealed', () => {
  const spinning = gameReducer(gameReducer(initialState, { type: 'start' }), {
    type: 'spin',
    optionId: 'simurian',
  });
  const restored = parseSavedGame(JSON.stringify(spinning));
  assert.deepEqual(restored, { ...spinning, phase: 'revealed' });
  assert.strictEqual(gameReducer(restored, { type: 'spin', optionId: 'human' }), restored);
});

test('corrupt, unreachable and unknown saved state safely starts fresh', () => {
  for (const raw of [
    null,
    '',
    'oops',
    'null',
    '{}',
    '[]',
    JSON.stringify({ phase: 'ready', stepId: 'lineage', results: {} }),
    JSON.stringify({ phase: 'complete', stepId: 'nature', results: { nature: 'human' } }),
    JSON.stringify({
      phase: 'revealed',
      stepId: 'nature',
      results: { nature: 'simurian', lineage: 'gojo' },
    }),
    JSON.stringify({ phase: 'spinning', stepId: 'nature', results: { nature: 'invented' } }),
  ]) {
    assert.deepEqual(parseSavedGame(raw), initialState);
  }
});
