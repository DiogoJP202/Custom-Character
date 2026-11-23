import test from 'node:test';
import assert from 'node:assert/strict';
import { wheels, getOption, getWheelProgress } from '../data/wheels.ts';
import { techniques } from '../data/techniques.ts';
import {
  eligibleTechniques,
  isStageAvailable,
  playableWheel,
  resultDetails,
  automaticOutcome,
  forcedOutcome,
} from './conditions.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';
import { getSegments, pickOption, landingRotation } from './wheel.ts';

const stage = (id: string) => wheels.find((wheel) => wheel.id === id)!;
function advance(state: GameState, optionId: string) {
  if (state.phase === 'revealed') {
    assert.ok(forcedOutcome(stage(state.stepId), state));
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
  assert.strictEqual(gameReducer(revealed, { type: 'spin', optionId }), revealed);
  return gameReducer(revealed, { type: 'continue' });
}
function beforeTech(
  nature = 'human',
  lineage = 'no-known-clan',
  condition = 'none',
  reserve = 'very-low',
) {
  let state = gameReducer(initialState, { type: 'start' });
  for (
    let steps = 0;
    state.phase !== 'complete' && state.stepId !== 'technique-presence';
    steps++
  ) {
    assert.ok(steps < wheels.length);
    const choice = (
      { nature, lineage, 'birth-condition': condition, 'energy-reserve': reserve } as Record<
        string,
        string
      >
    )[state.stepId];
    state = advance(state, choice ?? playableWheel(stage(state.stepId), state).options[0].id);
  }
  return state;
}

test('human lineages admit only their hereditary techniques without guaranteeing one', () => {
  const heirs: Record<string, string[]> = {
    'no-known-clan': [],
    gojo: ['limitless'],
    zenin: ['ten-shadows', 'projection'],
    kamo: ['blood-manipulation'],
    inumaki: ['cursed-speech'],
  };
  for (const [lineage, expected] of Object.entries(heirs)) {
    const state = beforeTech('human', lineage);
    assert.equal(state.stepId, 'technique-presence');
    const pool = eligibleTechniques(state);
    assert.ok(pool.length >= 6);
    assert.deepEqual(
      pool
        .filter((option) => option.technique?.lineage)
        .map((option) => option.id)
        .sort(),
      [...expected].sort(),
    );
    assert.ok(pool.some((option) => option.id === 'boogie-woogie'));
    for (const technique of pool) {
      const ready = advance(state, 'yes');
      assert.equal(ready.stepId, 'innate-technique');
      const complete = advance(ready, technique.id);
      assert.equal(complete.phase, 'ready');
      assert.equal(complete.stepId, 'energy-control');
      assert.equal(complete.results['innate-technique'], technique.id);
      assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
      assert.equal(
        resultDetails('innate-technique', complete)?.reference?.initialUse,
        technique.reference?.initialUse,
      );
    }
    const noTechnique = advance(state, 'no');
    assert.equal(noTechnique.phase, 'ready');
    assert.equal(noTechnique.stepId, 'energy-control');
    assert.equal(noTechnique.results['innate-technique'], undefined);
    assert.equal(isStageAvailable(stage('innate-technique'), noTechnique), false);
  }
});

test('low reserves and partial restrictions limit use rather than guaranteeing or erasing techniques', () => {
  const low = beforeTech('human', 'gojo', 'none', 'very-low');
  const immense = beforeTech('human', 'gojo', 'none', 'immense');
  assert.deepEqual(
    eligibleTechniques(low).map((o) => [o.id, o.weight]),
    eligibleTechniques(immense).map((o) => [o.id, o.weight]),
  );
  const partial = beforeTech('human', 'gojo', 'physical-partial');
  const complete = advance(advance(partial, 'yes'), 'limitless');
  const detail = resultDetails('innate-technique', complete)!;
  assert.match(detail.notes!, /Energia residual/);
  assert.match(detail.reference!.limitations, /Seis Olhos não acompanha/);
  assert.match(detail.reference!.initialUse!, /não se presume/);
  assert.equal(complete.results['energy-reserve'], 'very-low');
  const kokichi = beforeTech('human', 'no-known-clan', 'body-limited');
  const pool = eligibleTechniques(kokichi);
  assert.ok(pool.length > 1 && pool.some((option) => option.id === 'puppet-manipulation'));
  const other = advance(advance(kokichi, 'yes'), 'ratio');
  assert.match(
    resultDetails('innate-technique', other)!.notes!,
    /continua extremamente debilitado/,
  );
  assert.equal(other.results['innate-technique'], 'ratio');
});

test('full heavenly restriction skips both new wheels and rejects forged technique saves and spins', () => {
  const complete = beforeTech('human', 'zenin', 'physical-complete');
  assert.equal(complete.phase, 'complete');
  assert.equal(complete.stepId, 'equipment');
  assert.deepEqual(eligibleTechniques(complete), []);
  assert.match(automaticOutcome('technique-presence', complete)!.description, /energia própria/);
  for (const stepId of ['technique-presence', 'innate-technique']) {
    assert.equal(isStageAvailable(stage(stepId), complete), false);
    const ready = { ...complete, phase: 'ready' as const, stepId };
    assert.strictEqual(
      gameReducer(ready, {
        type: 'spin',
        optionId: stepId === 'technique-presence' ? 'yes' : 'ten-shadows',
      }),
      ready,
    );
    assert.strictEqual(
      parseSavedGame(
        JSON.stringify({
          ...complete,
          stepId,
          results: {
            ...complete.results,
            'technique-presence': 'yes',
            'innate-technique': 'ten-shadows',
          },
        }),
      ),
      initialState,
    );
  }
});

test('spirits have their own 90/10 distribution and exclusive compatible techniques', () => {
  const state = beforeTech('cursed-spirit');
  const no = advance(state, 'no');
  assert.match(resultDetails('technique-presence', no)!.description, /existência como espírito/);
  const wheel = playableWheel(stage('technique-presence'), state);
  assert.deepEqual(
    getSegments(wheel.options).map((s) => s.probability),
    [0.9, 0.1],
  );
  assert.deepEqual(
    getSegments(playableWheel(stage('technique-presence'), beforeTech()).options).map(
      (s) => s.probability,
    ),
    [0.8, 0.2],
  );
  const ready = advance(state, 'yes');
  const pool = playableWheel(stage('innate-technique'), ready).options;
  assert.ok(pool.length >= 3);
  for (const option of pool) {
    assert.equal(option.technique?.nature, 'cursed-spirit');
    assert.equal(advance(ready, option.id).stepId, 'energy-control');
  }
  assert.strictEqual(gameReducer(ready, { type: 'spin', optionId: 'blood-manipulation' }), ready);
  assert.equal(advance(state, 'no').stepId, 'energy-control');
});

test('independent corpses and simurians skip human technique rules and record catalog limits', () => {
  for (const nature of ['independent-cursed-corpse', 'simurian']) {
    const state = beforeTech(nature);
    assert.equal(state.phase, 'complete');
    assert.equal(state.results['technique-presence'], undefined);
    assert.equal(state.results['innate-technique'], undefined);
    assert.equal(isStageAvailable(stage('technique-presence'), state), false);
    assert.equal(
      automaticOutcome('technique-presence', state)!.name,
      'Técnica não catalogada nesta versão',
    );
    assert.match(automaticOutcome('technique-presence', state)!.description, /cânone/);
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  }
});

test('eligible probabilities, sampling and landing share one filtered distribution', () => {
  for (const lineage of stage('lineage').options.map((o) => o.id)) {
    for (const nature of ['human', 'cursed-spirit']) {
      const ready = advance(beforeTech(nature, lineage), 'yes');
      const options = playableWheel(stage('innate-technique'), ready).options;
      const segments = getSegments(options);
      assert.ok(Math.abs(segments.reduce((n, s) => n + s.probability, 0) - 1) < 1e-10);
      assert.ok(
        segments.every((segment) => segment.probability <= 0.5 && segment.probability >= 0.01),
      );
      const counts: Record<string, number> = {};
      for (let i = 0; i < 10000; i++) {
        const option = pickOption(options, () => (i + 0.5) / 10000);
        counts[option.id] = (counts[option.id] ?? 0) + 1;
      }
      for (const segment of segments) {
        assert.ok(Math.abs(counts[segment.option.id] - segment.probability * 10000) <= 1);
        assert.equal(pickOption(options, () => segment.middle / 360).id, segment.option.id);
        const angle = (segment.middle + landingRotation(segment)) % 360;
        assert.ok(angle < 1e-8 || 360 - angle < 1e-8);
      }
    }
  }
});

test('completed v3 games resume only eligible new stages, preserving every old result', () => {
  for (const nature of ['human', 'cursed-spirit', 'independent-cursed-corpse', 'simurian']) {
    const current = beforeTech(nature, 'gojo');
    const old = {
      ...current,
      phase: 'complete',
      stepId: 'energy-reserve',
      results: Object.fromEntries(
        Object.entries(current.results).filter(([id]) => stage(id).chapterId !== 'advanced'),
      ),
    };
    const restored = parseSavedGame(JSON.stringify(old));
    for (const [id, value] of Object.entries(old.results))
      assert.equal(restored.results[id], value);
    assert.equal(
      restored.phase,
      ['human', 'cursed-spirit'].includes(nature) ? 'ready' : 'revealed',
    );
    assert.equal(
      restored.stepId,
      ['human', 'cursed-spirit'].includes(nature) ? 'technique-presence' : 'recovery',
    );
    assert.deepEqual(parseSavedGame(JSON.stringify(restored)), restored);
  }
  const migrated = parseSavedGame(
    JSON.stringify({
      version: 3,
      phase: 'complete',
      stepId: 'energy-reserve',
      legacyBirth: true,
      results: {
        nature: 'human',
        lineage: 'kamo',
        strength: 'megumi',
        speed: 'maki-goodwill',
        endurance: 'panda',
        'energy-reserve': 'high',
      },
    }),
  );
  assert.equal(migrated.legacyBirth, true);
  assert.equal(migrated.stepId, 'technique-presence');
});

test('wrong lineage and techniques without an affirmative roll cannot be restored', () => {
  const noClan = advance(beforeTech(), 'yes');
  const forged = {
    ...noClan,
    phase: 'revealed',
    results: { ...noClan.results, 'innate-technique': 'limitless' },
  };
  assert.strictEqual(parseSavedGame(JSON.stringify(forged)), initialState);
  assert.strictEqual(gameReducer(noClan, { type: 'spin', optionId: 'limitless' }), noClan);
  const no = advance(beforeTech('human', 'gojo'), 'no');
  assert.strictEqual(
    parseSavedGame(
      JSON.stringify({
        ...no,
        stepId: 'innate-technique',
        results: { ...no.results, 'innate-technique': 'limitless' },
      }),
    ),
    initialState,
  );
});

test('development retries clear techniques and update chapter progress without changing prior rolls', () => {
  const ready = advance(beforeTech('human', 'gojo'), 'yes');
  assert.equal(
    getWheelProgress(stage('innate-technique'), ready.results, (w) => isStageAvailable(w, ready))
      .stepNumber,
    2,
  );
  const complete = advance(ready, 'limitless');
  const retry = gameReducer(complete, {
    type: 'retry',
    stepId: 'innate-technique',
    testMode: true,
  });
  assert.deepEqual(retry.results, ready.results);
  const retryPresence = gameReducer(complete, {
    type: 'retry',
    stepId: 'technique-presence',
    testMode: true,
  });
  assert.equal(retryPresence.results['innate-technique'], undefined);
  assert.equal(retryPresence.results['technique-presence'], undefined);
  assert.deepEqual(advance(retryPresence, 'no').results, {
    ...retryPresence.results,
    'technique-presence': 'no',
  });
});

test('technique entries include initial use, conditions and contextual official reading references', () => {
  assert.ok(techniques.filter((o) => o.technique?.nature === 'human').length >= 10);
  for (const option of techniques) {
    assert.equal(getOption('innate-technique', option.id), option);
    assert.ok(
      option.description &&
        option.reference?.character &&
        option.reference.version &&
        option.reference.initialUse &&
        option.reference.limitations,
    );
    assert.ok(option.reference.feats.length >= 1 && option.reference.feats.length <= 2);
    for (const feat of option.reference.feats) {
      assert.ok(feat.description && feat.context && feat.source.label);
      const url = new URL(feat.source.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(['jujutsukaisen.jp', 'jujutsukaisen-movie.jp'].includes(url.hostname));
    }
  }
});
