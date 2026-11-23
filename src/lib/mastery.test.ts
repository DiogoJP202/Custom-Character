import test from 'node:test';
import assert from 'node:assert/strict';
import { wheels, getOption, getWheelProgress } from '../data/wheels.ts';
import { techniques } from '../data/techniques.ts';
import {
  automaticOutcome,
  energySummary,
  forcedOutcome,
  isStageAvailable,
  playableWheel,
  resultDetails,
} from './conditions.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';
import { getSegments, landingRotation, pickOption } from './wheel.ts';

const stage = (id: string) => wheels.find((wheel) => wheel.id === id)!;
const masteryIds = ['energy-control', 'energy-output', 'technique-proficiency'];

function advance(state: GameState, optionId: string): GameState {
  if (state.phase === 'revealed') {
    assert.ok(forcedOutcome(stage(state.stepId), state));
    assert.equal(state.results[state.stepId], optionId);
    return gameReducer(state, { type: 'continue' });
  }
  assert.equal(state.phase, 'ready');
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

function chapterSix(choices: Record<string, string> = {}): GameState {
  let state = gameReducer(initialState, { type: 'start' });
  for (let i = 0; state.phase !== 'complete' && !masteryIds.includes(state.stepId); i++) {
    assert.ok(i < wheels.length);
    const options = playableWheel(stage(state.stepId), state).options;
    state = advance(state, choices[state.stepId] ?? options[0].id);
  }
  return state;
}

function finish(state: GameState, choices: Record<string, string> = {}): GameState {
  for (let i = 0; state.phase !== 'complete' && masteryIds.includes(state.stepId); i++) {
    assert.ok(i < masteryIds.length);
    const options = playableWheel(stage(state.stepId), state).options;
    state = advance(state, choices[state.stepId] ?? options[0].id);
  }
  assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  return state;
}

test('large reserve with low output and low reserve with high output have different practical consequences', () => {
  const large = finish(chapterSix({ 'energy-reserve': 'immense' }), {
    'energy-control': 'good',
    'energy-output': 'low',
  });
  const scarce = finish(chapterSix({ 'energy-reserve': 'very-low' }), {
    'energy-control': 'exceptional',
    'energy-output': 'high',
  });
  assert.match(
    energySummary(large).join(' '),
    /Reserva imensa, mas output baixo.*pouca energia liberada/,
  );
  assert.match(
    energySummary(scarce).join(' '),
    /descargas relativamente intensas podem consumir rapidamente/,
  );
  assert.match(energySummary(scarce).join(' '), /Controle excepcional.*sem multiplicar a reserva/);
  assert.equal(scarce.results['energy-reserve'], 'very-low');
  assert.match(
    resultDetails('technique-proficiency', scarce)!.reference!.initialUse!,
    /reserva muito baixa limita/,
  );
});

test('the same innate technique produces different applications without replacing energy or physical results', () => {
  const state = chapterSix({ 'energy-reserve': 'high' });
  assert.equal(state.results['innate-technique'], 'boogie-woogie');
  const beginner = finish(state, {
    'energy-control': 'poor',
    'energy-output': 'low',
    'technique-proficiency': 'beginner',
  });
  const advanced = finish(state, {
    'energy-control': 'advanced',
    'energy-output': 'high',
    'technique-proficiency': 'advanced',
  });
  const initialUse = resultDetails('technique-proficiency', beginner)!.reference!.initialUse!;
  const practicedUse = resultDetails('technique-proficiency', advanced)!.reference!.initialUse!;
  assert.match(initialUse, /troca simples/);
  assert.match(initialUse, /controle precário.*execução instável/);
  assert.match(practicedUse, /Coordena melhor trocas/);
  assert.match(practicedUse, /Não recebe a experiência tática de Todo/);
  assert.notEqual(initialUse, practicedUse);
  for (const [id, value] of Object.entries(state.results)) {
    assert.equal(beginner.results[id], value);
    assert.equal(advanced.results[id], value);
  }
  assert.equal(resultDetails('technique-proficiency', advanced)!.reference!.topic, 'proficiency');
});

test('every cataloged technique retains its own conditions at both initial and exceptional proficiency', () => {
  for (const technique of techniques) {
    const state = chapterSix({
      nature: technique.technique!.nature,
      lineage: technique.technique!.lineage ?? 'no-known-clan',
      'innate-technique': technique.id,
    });
    const initial = finish(state, { 'technique-proficiency': 'beginner' });
    const exceptional = finish(state, {
      'energy-control': 'exceptional',
      'technique-proficiency': 'exceptional',
    });
    const first = resultDetails('technique-proficiency', initial)!.reference!;
    const last = resultDetails('technique-proficiency', exceptional)!.reference!;
    assert.ok(first.initialUse!.startsWith(technique.reference!.initialUse!));
    assert.ok(last.initialUse!.startsWith(technique.technique!.practicedUse));
    assert.equal(last.limitations, technique.reference!.limitations);
    assert.deepEqual(last.feats, technique.reference!.feats);
    assert.equal(exceptional.results['innate-technique'], technique.id);
    const guards: Record<string, RegExp> = {
      'ten-shadows': /não recebe todos os shikigamis domesticados nem Mahoraga/,
      limitless: /Não concede Seis Olhos nem garante utilização plena/,
      'blood-manipulation': /Perda de sangue e gasto de energia/,
      construction: /custo continua elevado/,
      'puppet-manipulation': /Não recebe robôs/,
    };
    if (guards[technique.id]) assert.match(last.initialUse!, guards[technique.id]);
  }
});

test('no innate technique skips proficiency but preserves both general energy rolls', () => {
  for (const nature of ['human', 'cursed-spirit']) {
    let state = chapterSix({ nature, 'technique-presence': 'no', 'energy-reserve': 'immense' });
    assert.equal(state.stepId, 'energy-control');
    assert.equal(isStageAvailable(stage('technique-proficiency'), state), false);
    assert.equal(
      automaticOutcome('technique-proficiency', state)!.name,
      'Não se aplica — sem técnica inata',
    );
    assert.equal(
      getWheelProgress(stage('energy-control'), state.results, (wheel) =>
        isStageAvailable(wheel, state),
      ).totalSteps,
      2,
    );
    state = finish(state, { 'energy-control': 'advanced', 'energy-output': 'high' });
    assert.equal(state.stepId, 'recovery');
    assert.equal(state.results['technique-proficiency'], undefined);
    assert.equal(state.results['energy-reserve'], 'immense');
    assert.match(
      energySummary(state).join(' '),
      /aplicações gerais compatíveis, sem criar uma técnica/,
    );
    const forged = {
      ...state,
      stepId: 'technique-proficiency',
      results: { ...state.results, 'technique-proficiency': 'exceptional' },
    };
    assert.strictEqual(parseSavedGame(JSON.stringify(forged)), initialState);
  }
});

test('full restriction skips all three stages without randomness and rejects forged energy capacities', () => {
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('No random draw allowed for an absent energy consequence');
  };
  try {
    const complete = chapterSix({ 'birth-condition': 'physical-complete' });
    assert.equal(complete.phase, 'complete');
    assert.equal(complete.stepId, 'equipment');
    assert.match(energySummary(complete).join(' '), /Sem energia própria/);
    for (const id of masteryIds) {
      assert.equal(isStageAvailable(stage(id), complete), false);
      assert.match(resultDetails(id, complete)!.name, /energia própria ausente/);
      assert.equal(complete.results[id], undefined);
      const forged = { ...complete, phase: 'ready' as const, stepId: id };
      assert.strictEqual(
        gameReducer(forged, { type: 'spin', optionId: stage(id).options[0].id }),
        forged,
      );
      assert.strictEqual(
        parseSavedGame(
          JSON.stringify({
            ...forged,
            phase: 'revealed',
            results: { ...complete.results, [id]: stage(id).options[0].id },
          }),
        ),
        initialState,
      );
    }
    assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
  } finally {
    Math.random = originalRandom;
  }
});

test('partial restriction keeps control potential but fixes output automatically and caps effective proficiency', () => {
  const state = chapterSix({ 'birth-condition': 'physical-partial' });
  assert.equal(playableWheel(stage('energy-control'), state).options.length, 5);
  const output = advance(state, 'exceptional');
  assert.equal(output.stepId, 'energy-output');
  assert.equal(output.phase, 'revealed');
  assert.equal(output.results['energy-output'], 'very-low');
  assert.equal(output.results['energy-reserve'], 'very-low');
  assert.match(
    resultDetails('energy-control', output)!.description,
    /precisão potencial.*não habilita aplicações avançadas/,
  );
  assert.ok(forcedOutcome(stage('energy-output'), output));
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('Automatic output must not consume a draw');
  };
  try {
    const old = {
      ...output,
      phase: 'ready',
      results: { ...state.results, 'energy-control': 'exceptional' },
    };
    assert.deepEqual(parseSavedGame(JSON.stringify(old)), output);
    assert.deepEqual(parseSavedGame(JSON.stringify(output)), output);
    assert.strictEqual(gameReducer(output, { type: 'spin', optionId: 'extraordinary' }), output);
    assert.strictEqual(
      gameReducer(output, { type: 'retry', stepId: output.stepId, testMode: true }),
      output,
    );
  } finally {
    Math.random = originalRandom;
  }
  const proficiency = advance(output, 'very-low');
  assert.equal(proficiency.phase, 'ready');
  assert.equal(proficiency.stepId, 'technique-proficiency');
  assert.deepEqual(
    playableWheel(stage(proficiency.stepId), proficiency).options.map((option) => option.id),
    ['beginner', 'basic'],
  );
  assert.strictEqual(gameReducer(proficiency, { type: 'spin', optionId: 'advanced' }), proficiency);
  const complete = finish(proficiency, { 'technique-proficiency': 'basic' });
  assert.match(
    energySummary(complete).join(' '),
    /mesmo estas aplicações não são garantidas e permanecem iniciais/,
  );
  assert.strictEqual(
    parseSavedGame(
      JSON.stringify({
        ...complete,
        results: { ...complete.results, 'technique-proficiency': 'advanced' },
      }),
    ),
    initialState,
  );
});

test('Kokichi-type restriction preserves output advantage without repairing the body or assigning Puppets', () => {
  const state = chapterSix({
    'birth-condition': 'body-limited',
    'innate-technique': 'ratio',
    'energy-reserve': 'very-low',
  });
  assert.equal(state.results['innate-technique'], 'ratio');
  const options = playableWheel(stage('energy-output'), state).options;
  assert.deepEqual(
    options.map((option) => option.id),
    ['high', 'extraordinary'],
  );
  assert.deepEqual(
    getSegments(options).map((segment) => segment.probability),
    [2 / 3, 1 / 3],
  );
  const ready = advance(state, 'poor');
  assert.strictEqual(gameReducer(ready, { type: 'spin', optionId: 'low' }), ready);
  for (const option of options) {
    const complete = finish(ready, { 'energy-output': option.id });
    assert.match(
      resultDetails('energy-output', complete)!.description,
      /corpo continua extremamente debilitado/,
    );
    assert.match(
      resultDetails('energy-output', complete)!.reference!.limitations,
      /piso Alto é uma adaptação de gameplay/,
    );
    assert.match(energySummary(complete).join(' '), /podem consumir rapidamente/);
    assert.match(energySummary(complete).join(' '), /não reparam o corpo/);
    assert.equal(complete.results['energy-reserve'], 'very-low');
    assert.equal(complete.results['innate-technique'], 'ratio');
    assert.strictEqual(
      parseSavedGame(
        JSON.stringify({ ...complete, results: { ...complete.results, 'energy-output': 'low' } }),
      ),
      initialState,
    );
  }
});

test('spirit control and output have nature-specific explanations and compatible proficiency', () => {
  const complete = finish(
    chapterSix({ nature: 'cursed-spirit', 'innate-technique': 'idle-transfiguration' }),
  );
  for (const id of ['energy-control', 'energy-output']) {
    const result = resultDetails(id, complete)!;
    assert.match(result.description, /sem pressupor corpo ou metabolismo humano/);
    assert.equal(result.reference!.topic, 'energy');
    assert.notEqual(result.reference!.character, 'Yuji Itadori');
  }
  assert.equal(resultDetails('technique-proficiency', complete)!.reference!.character, 'Mahito');
  assert.equal(complete.results.lineage, undefined);
});

test('corpses and simurians preserve their reserve and explicitly record catalog limits instead of human abilities', () => {
  for (const nature of ['independent-cursed-corpse', 'simurian']) {
    const complete = chapterSix({ nature });
    assert.equal(complete.phase, 'complete');
    for (const id of masteryIds) {
      assert.equal(isStageAvailable(stage(id), complete), false);
      assert.equal(complete.results[id], undefined);
      assert.match(
        resultDetails(id, complete)!.description,
        /limitação do catálogo|não declara uma incapacidade/,
      );
    }
    assert.deepEqual(parseSavedGame(JSON.stringify(complete)), complete);
    assert.match(energySummary(complete).join(' '), /reserva.*preservada/);
    assert.equal(complete.results['energy-reserve'], 'very-low');
    if (nature === 'simurian') {
      assert.equal(playableWheel(stage('energy-control'), complete).name, 'Controle de rolloluca');
      assert.match(resultDetails('energy-output', complete)!.name, /rolloluca/);
    }
  }
});

test('new and filtered probabilities match sampling intervals and wheel landing', () => {
  const expected = [
    [15, 25, 30, 20, 10],
    [15, 25, 30, 20, 10],
    [20, 25, 25, 20, 10],
  ];
  masteryIds.forEach((id, index) =>
    assert.deepEqual(
      stage(id).options.map((option) => option.weight),
      expected[index],
    ),
  );
  for (const choices of [
    {},
    { 'birth-condition': 'physical-partial' },
    { 'birth-condition': 'body-limited' },
    { nature: 'cursed-spirit' },
  ]) {
    const state = chapterSix(choices);
    for (const id of masteryIds) {
      const options = playableWheel(stage(id), state).options;
      const segments = getSegments(options);
      assert.ok(
        Math.abs(segments.reduce((sum, segment) => sum + segment.probability, 0) - 1) < 1e-10,
      );
      const counts = new Map<string, number>();
      // Single options are inspected geometrically but never sampled during gameplay.
      if (options.length > 1)
        for (let i = 0; i < 9000; i++) {
          const id = pickOption(options, () => (i + 0.5) / 9000).id;
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
      for (const segment of segments) {
        if (options.length > 1)
          assert.ok(Math.abs(counts.get(segment.option.id)! - segment.probability * 9000) <= 1);
        assert.ok(Math.abs((segment.end - segment.start) / 360 - segment.probability) < 1e-10);
        assert.ok(Math.abs((segment.middle + landingRotation(segment)) % 360) < 1e-8);
      }
    }
  }
});

test('old Chapter 5 saves resume Chapter 6 without random attributes or lost results; interrupted reveals stay committed', () => {
  for (const choices of [
    {},
    { 'technique-presence': 'no' },
    { nature: 'cursed-spirit' },
    { 'birth-condition': 'physical-partial' },
    { 'birth-condition': 'body-limited' },
  ]) {
    const ready = chapterSix(choices);
    assert.equal(ready.phase, 'ready');
    assert.equal(ready.stepId, 'energy-control');
    const last = wheels.filter((wheel) => ready.results[wheel.id]).at(-1)!;
    const old = { ...ready, phase: 'complete', stepId: last.id };
    const restored = parseSavedGame(JSON.stringify(old));
    assert.deepEqual(restored, ready);
    assert.deepEqual(restored.results, old.results);
    const pendingReveal = { ...old, phase: 'spinning' };
    const revealed = parseSavedGame(JSON.stringify(pendingReveal));
    assert.equal(revealed.phase, 'revealed');
    assert.equal(revealed.stepId, last.id);
    assert.deepEqual(revealed.results, old.results);
    assert.deepEqual(gameReducer(revealed, { type: 'continue' }), ready);
    assert.deepEqual(parseSavedGame(JSON.stringify(restored)), restored);
  }
  const migrated = parseSavedGame(
    JSON.stringify({
      version: 3,
      phase: 'complete',
      legacyBirth: true,
      stepId: 'technique-presence',
      results: {
        nature: 'human',
        lineage: 'gojo',
        strength: 'megumi',
        speed: 'toji',
        endurance: 'panda',
        'energy-reserve': 'high',
        'technique-presence': 'no',
      },
    }),
  );
  assert.equal(migrated.stepId, 'energy-control');
  assert.equal(migrated.legacyBirth, true);
  assert.equal(migrated.results['birth-condition'], undefined);
  assert.deepEqual(parseSavedGame(JSON.stringify(migrated)), migrated);
});

test('development retries clear only the selected and later capacities; previous conditions and weights persist', () => {
  const complete = finish(chapterSix({ 'birth-condition': 'physical-partial' }));
  for (const id of [
    'energy-control',
    'technique-proficiency',
    'innate-technique',
    'technique-presence',
    'birth-condition',
  ]) {
    const index = wheels.indexOf(stage(id));
    const retry = gameReducer(complete, { type: 'retry', stepId: id, testMode: true });
    assert.equal(retry.stepId, id);
    assert.equal(retry.phase, 'ready');
    assert.deepEqual(
      retry.results,
      Object.fromEntries(
        Object.entries(complete.results).filter(
          ([stepId]) => wheels.indexOf(stage(stepId)) < index,
        ),
      ),
    );
    assert.deepEqual(parseSavedGame(JSON.stringify(retry)), retry);
    assert.strictEqual(
      gameReducer(complete, { type: 'retry', stepId: id, testMode: false }),
      complete,
    );
  }
  assert.strictEqual(
    gameReducer(complete, { type: 'retry', stepId: 'energy-output', testMode: true }),
    complete,
  );
  const ordinary = finish(chapterSix());
  const retry = gameReducer(ordinary, { type: 'retry', stepId: 'energy-output', testMode: true });
  assert.equal(retry.results['energy-output'], undefined);
  assert.equal(retry.results['technique-proficiency'], undefined);
  assert.equal(retry.results['energy-control'], ordinary.results['energy-control']);
  assert.equal(getOption('nature', 'human')!.weight, 45);
});
