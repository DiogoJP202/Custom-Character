import test from 'node:test';
import assert from 'node:assert/strict';
import { wheels } from '../data/wheels.ts';
import {
  automaticOutcome,
  isStageAvailable,
  physicalAdjustment,
  playableWheel,
  resultDetails,
  forcedOutcome,
} from './conditions.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';
import { getSegments, pickOption, landingRotation } from './wheel.ts';

function commit(state: GameState, optionId: string) {
  if (state.phase === 'revealed') {
    assert.ok(
      forcedOutcome(
        wheels.find((wheel) => wheel.id === state.stepId)!,
        state,
      ),
    );
    assert.equal(state.results[state.stepId], optionId);
    return gameReducer(state, { type: 'continue' });
  }
  const spinning = gameReducer(state, { type: 'spin', optionId });
  assert.equal(spinning.phase, 'spinning');
  assert.strictEqual(gameReducer(spinning, { type: 'spin', optionId }), spinning);
  assert.strictEqual(gameReducer(spinning, { type: 'continue' }), spinning);
  assert.strictEqual(
    gameReducer(spinning, { type: 'retry', stepId: state.stepId, testMode: true }),
    spinning,
  );
  const revealed = gameReducer(spinning, { type: 'reveal' });
  assert.deepEqual(parseSavedGame(JSON.stringify(spinning)), revealed);
  assert.deepEqual(parseSavedGame(JSON.stringify(revealed)), revealed);
  return gameReducer(revealed, { type: 'continue' });
}

function born(condition: string) {
  let state = commit(gameReducer(initialState, { type: 'start' }), 'human');
  assert.equal(state.stepId, 'lineage');
  state = commit(state, 'zenin');
  assert.equal(state.stepId, 'birth-condition');
  return commit(state, condition);
}

test('all human birth conditions affect final physical capacities without erasing rolled references', () => {
  for (const condition of ['none', 'physical-partial', 'physical-complete', 'body-limited']) {
    let state = born(condition);
    for (const [stepId, optionId] of [
      ['strength', 'toji'],
      ['speed', 'toji'],
      ['endurance', 'hanami'],
    ]) {
      assert.equal(state.stepId, stepId);
      state = commit(state, optionId);
      assert.equal(state.results[stepId], optionId);
      const detail = resultDetails(stepId, state)!;
      assert.equal(!!detail.adjustment, condition !== 'none');
      assert.equal(
        detail.adjustment?.capacity,
        (
          {
            'physical-partial': 'enhanced',
            'physical-complete': 'extraordinary',
            'body-limited': 'severely-limited',
          } as Record<string, string>
        )[condition],
      );
      if (condition !== 'none') {
        assert.match(detail.notes!, /Referência sorteada/);
        assert.match(
          detail.description,
          condition === 'physical-complete'
            ? /extraordinária/
            : condition === 'physical-partial'
              ? /Maki no Intercâmbio/
              : /debilitado/,
        );
      }
    }
    if (condition === 'physical-complete') {
      assert.equal(state.phase, 'ready');
      assert.equal(state.stepId, 'equipment');
      assert.equal(state.results['energy-reserve'], undefined);
      assert.match(automaticOutcome('energy-reserve', state)!.description, /Nenhuma energia/);
    } else {
      assert.equal(state.stepId, 'energy-reserve');
      const base = wheels.find((wheel) => wheel.id === state.stepId)!;
      const effective = playableWheel(base, state);
      if (condition === 'physical-partial') {
        assert.deepEqual(
          effective.options.map((option) => option.id),
          ['very-low'],
        );
        assert.deepEqual(
          getSegments(effective.options).map((segment) => segment.probability),
          [1],
        );
        assert.strictEqual(gameReducer(state, { type: 'spin', optionId: 'immense' }), state);
      } else assert.equal(effective.options.length, 5);
      state = commit(state, condition === 'physical-partial' ? 'very-low' : 'immense');
      assert.equal(state.stepId, 'technique-presence');
      state = commit(state, 'no');
      assert.equal(state.stepId, 'energy-control');
      state = commit(state, 'good');
      assert.equal(state.stepId, 'energy-output');
      state = commit(state, condition === 'physical-partial' ? 'very-low' : 'high');
      assert.equal(state.stepId, 'recovery');
      assert.equal(state.phase, condition === 'physical-partial' ? 'revealed' : 'ready');
      if (condition === 'body-limited') {
        assert.match(resultDetails('energy-reserve', state)!.description, /não altera o estoque/);
        assert.match(physicalAdjustment('speed', state)!.label, /locomoção muito limitada/);
      }
    }
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  }
});

test('nonhuman energy uses each nature, including rolloluca, with no human birth condition', () => {
  for (const [nature, term] of [
    ['cursed-spirit', /constituída de energia/],
    ['independent-cursed-corpse', /artificial autônomo/],
    ['simurian', /Rolloluca/],
  ] as const) {
    let state = commit(gameReducer(initialState, { type: 'start' }), nature);
    assert.equal(state.stepId, 'strength');
    assert.equal(
      isStageAvailable(
        wheels.find((wheel) => wheel.id === 'birth-condition')!,
        state,
      ),
      false,
    );
    for (const stepId of ['strength', 'speed', 'endurance']) {
      assert.equal(state.stepId, stepId);
      state = commit(state, wheels.find((wheel) => wheel.id === stepId)!.options[0].id);
    }
    for (const option of wheels.find((wheel) => wheel.id === 'energy-reserve')!.options) {
      const complete = commit(state, option.id);
      assert.equal(complete.phase, nature === 'cursed-spirit' ? 'ready' : 'revealed');
      assert.match(resultDetails('energy-reserve', complete)!.description, term);
      assert.equal(complete.results['birth-condition'], undefined);
    }
    if (nature === 'simurian')
      assert.equal(
        playableWheel(
          wheels.find((wheel) => wheel.id === 'energy-reserve')!,
          state,
        ).name,
        'Reserva de rolloluca',
      );
  }
});

test('partial and full restrictions reject incompatible restored energy, and full skips spins', () => {
  for (const condition of ['physical-complete', 'physical-partial']) {
    let state = born(condition);
    for (const stepId of ['strength', 'speed', 'endurance'])
      state = commit(state, wheels.find((wheel) => wheel.id === stepId)!.options[0].id);
    const forged = {
      ...state,
      phase: 'complete',
      stepId: 'energy-reserve',
      results: { ...state.results, 'energy-reserve': 'immense' },
    };
    assert.strictEqual(parseSavedGame(JSON.stringify(forged)), initialState);
    if (condition === 'physical-complete') {
      const ready = { ...state, phase: 'ready' as const, stepId: 'energy-reserve' };
      assert.strictEqual(gameReducer(ready, { type: 'spin', optionId: 'very-low' }), ready);
    }
  }
});

test('all old flow phases migrate idempotently, without random birth conditions or lost rolls', () => {
  for (const nature of wheels[0].options.map((option) => option.id)) {
    const path = wheels.filter(
      (wheel) =>
        ['origin', 'physical'].includes(wheel.chapterId) &&
        (!wheel.availableWhen || nature === 'human'),
    );
    const results: Record<string, string> = {};
    for (const wheel of path) {
      for (const version of [undefined, 2]) {
        const ready = parseSavedGame(
          JSON.stringify({ version, phase: 'ready', stepId: wheel.id, results }),
        );
        assert.deepEqual(ready.results, results);
        assert.deepEqual(parseSavedGame(JSON.stringify(ready)), ready);
        if (wheel.id === 'strength' && nature === 'human')
          assert.equal(ready.stepId, 'birth-condition');
      }
      results[wheel.id] = wheel.id === 'nature' ? nature : wheel.options[0].id;
      for (const phase of ['spinning', 'revealed', 'complete']) {
        const restored = parseSavedGame(
          JSON.stringify({ version: 2, phase, stepId: wheel.id, results }),
        );
        assert.deepEqual(restored.results, results);
        assert.equal(restored.results['birth-condition'], undefined);
        assert.deepEqual(parseSavedGame(JSON.stringify(restored)), restored);
        if (nature === 'human' && ['strength', 'speed', 'endurance'].some((id) => results[id])) {
          assert.equal(restored.legacyBirth, true);
          assert.match(automaticOutcome('birth-condition', restored)!.name, /Não registrada/);
        }
        if (phase === 'complete' && wheel.id === 'endurance')
          assert.equal(restored.stepId, 'energy-reserve');
      }
    }
  }
});

test('development retries invalidate consequences and energy and return migrated origins to the new flow', () => {
  const full = born('physical-complete');
  const retry = gameReducer(full, { type: 'retry', stepId: 'birth-condition', testMode: true });
  assert.deepEqual(retry.results, { nature: 'human', lineage: 'zenin' });
  assert.equal(automaticOutcome('energy-reserve', retry), undefined);
  const old = parseSavedGame(
    JSON.stringify({
      version: 2,
      phase: 'complete',
      stepId: 'endurance',
      results: {
        nature: 'human',
        lineage: 'gojo',
        strength: 'megumi',
        speed: 'toji',
        endurance: 'hanami',
      },
    }),
  );
  const physicalRetry = gameReducer(old, { type: 'retry', stepId: 'strength', testMode: true });
  assert.equal(physicalRetry.legacyBirth, true);
  assert.deepEqual(parseSavedGame(JSON.stringify(physicalRetry)), physicalRetry);
  const originRetry = gameReducer(old, { type: 'retry', stepId: 'lineage', testMode: true });
  assert.equal(originRetry.legacyBirth, undefined);
  assert.equal(commit(originRetry, 'gojo').stepId, 'birth-condition');
});

test('rebalanced catalog weights keep odds, segments and landing synchronized with restrictions', () => {
  assert.deepEqual(
    wheels.find((wheel) => wheel.id === 'birth-condition')!.options.map((option) => option.weight),
    [65, 15, 10, 10],
  );
  assert.deepEqual(
    wheels.find((wheel) => wheel.id === 'energy-reserve')!.options.map((option) => option.weight),
    [15, 25, 25, 20, 15],
  );
  // PR #1 weights applied to the current catalog, preserving later stages and IDs.
  const expectedWeights: Record<string, number[]> = {
    nature: [45, 30, 17, 8],
    lineage: [40, 15, 18, 17, 10],
    strength: [21, 19, 18, 17, 15, 10],
    speed: [26, 23, 20, 18, 13],
    endurance: [26, 22, 20, 18, 14],
  };
  for (const [id, weights] of Object.entries(expectedWeights)) {
    assert.deepEqual(
      wheels.find((wheel) => wheel.id === id)!.options.map((option) => option.weight),
      weights,
    );
  }
  for (const condition of ['none', 'physical-partial', 'physical-complete', 'body-limited']) {
    const state = born(condition);
    for (const wheel of wheels) {
      if (!isStageAvailable(wheel, state)) continue;
      const options = playableWheel(wheel, state).options;
      for (const segment of getSegments(options)) {
        assert.equal(pickOption(options, () => segment.middle / 360).id, segment.option.id);
        assert.ok(Math.abs((segment.end - segment.start) / 360 - segment.probability) < 1e-10);
        assert.ok(Math.abs((segment.middle + landingRotation(segment)) % 360) < 1e-8);
      }
    }
  }
});
