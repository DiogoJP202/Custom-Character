import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, getOption, getWheelProgress, wheels } from '../data/wheels.ts';
import { techniques } from '../data/techniques.ts';
import { domainOptions } from '../data/domains.ts';
import { documentedDomain, domainSummary } from './domains.ts';
import { forcedOutcome, isStageAvailable, playableWheel, resultDetails } from './conditions.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';
import { getSegments, landingRotation, pickOption } from './wheel.ts';

const stage = (id: string) => wheels.find((wheel) => wheel.id === id)!;
const domainIds = [
  'chimera-shadow-garden',
  'self-embodiment-of-perfection',
  'coffin-of-the-iron-mountain',
];

// Produce a real Chapter 7 path, then serialize its former terminal state.
function oldSeven(
  technique = 'ten-shadows',
  nature = 'human',
  condition = 'none',
  changes: Record<string, string> = {},
): GameState {
  const lineage = getOption('innate-technique', technique)?.technique?.lineage ?? 'no-known-clan';
  const choices = {
    nature,
    lineage,
    'birth-condition': condition,
    'technique-presence': technique ? 'yes' : 'no',
    'innate-technique': technique,
    'energy-reserve': 'high',
    'energy-control': 'advanced',
    'energy-output': 'high',
    'technique-proficiency': 'competent',
    recovery: nature === 'human' ? 'no-rct' : 'spirit-limited',
    'anti-domain': 'none',
    equipment: 'common-tool',
    ...changes,
  };
  let state = gameReducer(initialState, { type: 'start' });
  for (let i = 0; i < wheels.length; i++) {
    const wheel = playableWheel(stage(state.stepId), state);
    if (state.phase === 'ready') {
      const choice = choices[state.stepId as keyof typeof choices];
      const optionId = wheel.options.some((o) => o.id === choice) ? choice : wheel.options[0].id;
      state = gameReducer(gameReducer(state, { type: 'spin', optionId }), { type: 'reveal' });
    }
    assert.equal(state.phase, 'revealed');
    if (state.stepId === 'equipment') return { ...state, phase: 'complete' };
    state = gameReducer(state, { type: 'continue' });
  }
  throw new Error('Chapter 7 was not reached');
}
const resume = (...args: Parameters<typeof oldSeven>) =>
  parseSavedGame(JSON.stringify(oldSeven(...args)));
function advance(state: GameState, optionId: string): GameState {
  assert.equal(state.phase, 'ready');
  const spinning = gameReducer(state, { type: 'spin', optionId });
  assert.equal(spinning.phase, 'spinning');
  for (const action of [
    { type: 'spin', optionId },
    { type: 'continue' },
    { type: 'retry', stepId: state.stepId, testMode: true },
  ] as const)
    assert.strictEqual(gameReducer(spinning, action), spinning);
  const revealed = gameReducer(spinning, { type: 'reveal' });
  assert.deepEqual(parseSavedGame(JSON.stringify(spinning)), revealed);
  assert.deepEqual(parseSavedGame(JSON.stringify(revealed)), revealed);
  assert.strictEqual(gameReducer(revealed, { type: 'spin', optionId }), revealed);
  return gameReducer(revealed, { type: 'continue' });
}
function positive(
  technique: string,
  nature = 'human',
  changes: Record<string, string> = {},
  barrier = 'advanced',
) {
  let state = advance(resume(technique, nature, 'none', changes), barrier);
  assert.equal(state.stepId, 'domain-expansion');
  state = advance(state, documentedDomain(state)!.id);
  assert.equal(state.phase, 'complete');
  assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  return state;
}

test('only the three documented manifestations match their existing technique and nature', () => {
  assert.equal(chapters[7].id, 'domains');
  for (const technique of techniques) {
    const nature = technique.technique!.nature;
    const state = resume(technique.id, nature);
    const domain = documentedDomain(state);
    assert.equal(
      !!domain,
      ['ten-shadows', 'idle-transfiguration', 'jogo-flames'].includes(technique.id),
    );
    assert.equal(isStageAvailable(stage('domain-expansion'), state), !!domain);
    if (domain) {
      assert.equal(domain.domain!.techniqueId, technique.id);
      assert.deepEqual(
        playableWheel(stage('domain-expansion'), state).options.map((o) => o.id),
        ['none', domain.id],
      );
    } else {
      assert.deepEqual(playableWheel(stage('domain-expansion'), state).options, []);
      assert.match(resultDetails('domain-expansion', state)!.name, /Nenhuma expansão específica/);
    }
  }
  assert.equal(
    documentedDomain({
      results: {
        nature: 'human',
        lineage: 'gojo',
        'technique-presence': 'yes',
        'innate-technique': 'ten-shadows',
      },
    }),
    undefined,
  );
});

test('old completed games resume barriers without RNG or losing a single old result', () => {
  const original = Math.random;
  const old = oldSeven();
  Math.random = () => {
    throw new Error('Restoration must not draw new outcomes');
  };
  try {
    const ready = parseSavedGame(JSON.stringify(old));
    assert.equal(ready.phase, 'ready');
    assert.equal(ready.stepId, 'barrier-knowledge');
    assert.deepEqual(ready.results, old.results);
    assert.equal(ready.results['barrier-knowledge'], undefined);
    assert.deepEqual(parseSavedGame(JSON.stringify(ready)), ready);
    assert.equal(
      getWheelProgress(stage(ready.stepId), ready.results, (wheel) =>
        isStageAvailable(wheel, ready),
      ).chapterNumber,
      8,
    );
  } finally {
    Math.random = original;
  }
});

test('barrier levels never grant Simple Domain or an expansion without a separate manual roll', () => {
  for (const option of stage('barrier-knowledge').options) {
    const ready = resume();
    assert.equal(forcedOutcome(stage(ready.stepId), ready), undefined);
    const state = advance(ready, option.id);
    assert.equal(state.phase, 'ready');
    assert.equal(state.stepId, 'domain-expansion');
    assert.equal(state.results['anti-domain'], 'none');
    assert.equal(state.results['domain-expansion'], undefined);
    assert.equal(state.results['energy-control'], ready.results['energy-control']);
  }
});

test('Chimera Shadow Garden remains incomplete even with exceptional prior capacities', () => {
  const state = positive('ten-shadows', 'human', {
    'energy-reserve': 'immense',
    'energy-control': 'exceptional',
    'energy-output': 'extraordinary',
    'technique-proficiency': 'exceptional',
  });
  const result = resultDetails('domain-expansion', state)!;
  assert.equal(result.domain!.manifestation, 'incomplete');
  assert.match(
    result.reference!.initialUse!,
    /permanece incompleta.*sem barreira fechada convencional ou acerto garantido/,
  );
  assert.match(
    result.reference!.limitations,
    /Não concede todos os shikigamis domesticados, Mahoraga/,
  );
  assert.match(result.reference!.initialUse!, /recinto compatível/);
  assert.match(domainSummary(state).join(' '), /Jardim da Sombra Quimérica.*Dez Sombras/);
});

test('low reserve, control, output, proficiency and barrier training restrict execution without erasing access', () => {
  for (const [technique, nature] of [
    ['ten-shadows', 'human'],
    ['idle-transfiguration', 'cursed-spirit'],
    ['jogo-flames', 'cursed-spirit'],
  ]) {
    const changes = {
      'energy-reserve': 'very-low',
      'energy-control': 'poor',
      'energy-output': 'very-low',
      'technique-proficiency': 'beginner',
    };
    const state = positive(technique, nature, changes, 'untrained');
    for (const [id, value] of Object.entries(changes)) assert.equal(state.results[id], value);
    const result = resultDetails('domain-expansion', state)!;
    assert.equal(result.id, documentedDomain(state)!.id);
    assert.match(
      result.reference!.initialUse!,
      /não são confiáveis.*reserva.*controle.*output.*formação.*proficiência/,
    );
    assert.equal(
      result.domain!.manifestation,
      technique === 'ten-shadows' ? 'incomplete' : 'complete',
    );
    if (technique !== 'ten-shadows')
      assert.match(result.reference!.initialUse!, /não a transformam.*incompleta inventada/);
  }
});

test('full restriction skips both stages without RNG and does not claim universal domain immunity', () => {
  const old = oldSeven('', 'human', 'physical-complete');
  const original = Math.random;
  Math.random = () => {
    throw new Error('No draw for absent own energy');
  };
  try {
    const state = parseSavedGame(JSON.stringify(old));
    assert.deepEqual(state, old);
    for (const id of ['barrier-knowledge', 'domain-expansion']) {
      assert.equal(isStageAvailable(stage(id), state), false);
      assert.match(resultDetails(id, state)!.description, /Não concede imunidade universal/);
    }
    assert.match(domainSummary(state).join(' '), /físico extraordinário/);
  } finally {
    Math.random = original;
  }
});

test('partial restriction can receive knowledge, but residual energy prevents an effective expansion', () => {
  const state = advance(resume('ten-shadows', 'human', 'physical-partial'), 'advanced');
  assert.equal(state.phase, 'complete');
  assert.equal(state.results['barrier-knowledge'], 'advanced');
  assert.equal(state.results['domain-expansion'], undefined);
  assert.equal(state.results['energy-reserve'], 'very-low');
  assert.equal(state.results['energy-output'], 'very-low');
  assert.match(
    resultDetails('barrier-knowledge', state)!.description,
    /conhecimento.*energia residual/,
  );
  assert.match(resultDetails('domain-expansion', state)!.description, /não cria um domínio físico/);
});

test('Kokichi-type output and range do not grant a domain or replace the impaired body', () => {
  let state = resume('ten-shadows', 'human', 'body-limited', { 'energy-output': 'extraordinary' });
  state = advance(advance(state, 'advanced'), 'chimera-shadow-garden');
  assert.match(
    resultDetails('domain-expansion', state)!.reference!.initialUse!,
    /debilidade corporal permanece.*corpo substituto/,
  );
  assert.equal(state.results['birth-condition'], 'body-limited');
  assert.equal(state.results['innate-technique'], 'ten-shadows');
});

test('without an innate technique barriers still progress; earlier defenses and equipment remain useful', () => {
  const state = advance(
    resume('', 'human', 'none', { 'anti-domain': 'simple-domain', equipment: 'playful-cloud' }),
    'advanced',
  );
  assert.equal(state.phase, 'complete');
  assert.equal(state.results['domain-expansion'], undefined);
  const summary = domainSummary(state).join(' ');
  assert.match(summary, /Sem técnica inata/);
  assert.match(summary, /Nuvem Brincalhona/);
  assert.match(summary, /Domínio Simples.*sem neutralização universal ou expansão própria/);
});

test('Limitless without Six Eyes, Mai Construction, human Projection, Geto and Hanami get no invented domain', () => {
  for (const [technique, expression] of [
    ['limitless', /Seis Olhos/],
    ['construction', /Mai.*Yorozu/],
    ['projection', /Naobito humano.*Naoya/],
    ['cursed-spirit-manipulation', /Kenjaku.*Geto/],
    ['hanami-plants', /não afirma.*impossível/],
  ] as const) {
    const state = advance(
      resume(technique, technique === 'hanami-plants' ? 'cursed-spirit' : 'human'),
      'advanced',
    );
    assert.equal(state.phase, 'complete');
    assert.match(resultDetails('domain-expansion', state)!.description, expression);
    assert.equal(state.results['domain-expansion'], undefined);
  }
});

test('spirit barrier descriptions respect nature; corpses and simurians retain their equipment paths', () => {
  const spirit = advance(resume('idle-transfiguration', 'cursed-spirit'), 'basic');
  assert.match(
    resultDetails('barrier-knowledge', spirit)!.description,
    /por um espírito.*não.*fisiologia humana/,
  );
  for (const nature of ['independent-cursed-corpse', 'simurian']) {
    const old = oldSeven('', nature);
    assert.deepEqual(parseSavedGame(JSON.stringify(old)), old);
    assert.equal(old.results.equipment, 'common-tool');
    assert.equal(isStageAvailable(stage('barrier-knowledge'), old), false);
    assert.equal(isStageAvailable(stage('domain-expansion'), old), false);
    assert.match(
      resultDetails('domain-expansion', old)!.description,
      /não afirma incapacidade canônica/,
    );
    assert.match(domainSummary(old).join(' '), /Equipamento/);
    if (nature === 'simurian')
      assert.match(resultDetails('domain-expansion', old)!.description, /rolloluca/);
  }
});

test('barrier and filtered domain probabilities share the exact draw intervals, segments and landing points', () => {
  assert.deepEqual(
    stage('barrier-knowledge').options.map((o) => o.weight),
    [25, 35, 25, 15],
  );
  for (const [technique, nature] of [
    ['ten-shadows', 'human'],
    ['idle-transfiguration', 'cursed-spirit'],
    ['jogo-flames', 'cursed-spirit'],
  ]) {
    const ready = resume(technique, nature);
    const filtered = playableWheel(stage('domain-expansion'), ready);
    assert.deepEqual(
      filtered.options.map((o) => o.weight),
      [65, 35],
    );
    for (const wheel of [stage('barrier-knowledge'), filtered]) {
      const counts: Record<string, number> = {};
      for (let n = 0; n < 1000; n++) {
        const id = pickOption(wheel.options, () => (n + 0.5) / 1000).id;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      for (const segment of getSegments(wheel.options)) {
        assert.equal(counts[segment.option.id], segment.probability * 1000);
        assert.ok(Math.abs(segment.end - segment.start - segment.probability * 360) < 1e-8);
        assert.ok(Math.abs((landingRotation(segment) + segment.middle) % 360) < 1e-8);
      }
    }
  }
});

test('forged domains, missing prerequisites, wrong nature and inaccessible stages are rejected on restoration and spin', () => {
  const state = positive('ten-shadows');
  const replace = (changes: Record<string, string>) => ({
    ...state,
    results: { ...state.results, ...changes },
  });
  for (const forged of [
    replace({ 'domain-expansion': domainIds[1] }),
    replace({ 'domain-expansion': domainIds[2] }),
    replace({ 'innate-technique': 'limitless', lineage: 'gojo' }),
    replace({ 'technique-presence': 'no' }),
    replace({ 'birth-condition': 'physical-complete' }),
    replace({ 'birth-condition': 'physical-partial' }),
    replace({ nature: 'simurian' }),
    replace({ 'barrier-knowledge': 'invented' }),
    {
      ...state,
      results: Object.fromEntries(
        Object.entries(state.results).filter(([id]) => id !== 'barrier-knowledge'),
      ),
    },
  ])
    assert.strictEqual(parseSavedGame(JSON.stringify(forged)), initialState);
  const ready = advance(resume(), 'basic');
  for (const id of domainIds.slice(1))
    assert.strictEqual(gameReducer(ready, { type: 'spin', optionId: id }), ready);
  const noCatalog = advance(resume('boogie-woogie'), 'advanced');
  const forgedReady = { ...noCatalog, phase: 'ready' as const, stepId: 'domain-expansion' };
  assert.strictEqual(gameReducer(forgedReady, { type: 'spin', optionId: 'none' }), forgedReady);
});

test('negative outcomes complete normally and development retries clear only the chosen stage and later results', () => {
  const ready = advance(resume(), 'advanced');
  const negative = advance(ready, 'none');
  assert.equal(negative.phase, 'complete');
  assert.equal(negative.results['domain-expansion'], 'none');
  assert.deepEqual(parseSavedGame(JSON.stringify(negative)), negative);
  const state = positive('ten-shadows');
  for (const id of ['barrier-knowledge', 'domain-expansion']) {
    assert.strictEqual(gameReducer(state, { type: 'retry', stepId: id, testMode: false }), state);
    const retry = gameReducer(state, { type: 'retry', stepId: id, testMode: true });
    assert.equal(retry.phase, 'ready');
    assert.equal(retry.stepId, id);
    assert.equal(retry.results['domain-expansion'], undefined);
    assert.equal(retry.results.equipment, state.results.equipment);
    assert.equal(retry.results['innate-technique'], state.results['innate-technique']);
    assert.equal(
      retry.results['barrier-knowledge'],
      id === 'barrier-knowledge' ? undefined : 'advanced',
    );
    assert.deepEqual(parseSavedGame(JSON.stringify(retry)), retry);
  }
});

test('every positive entry preserves a documented manifestation, reference, contextual feat, limits and official source', () => {
  for (const option of domainOptions.filter((o) => o.domain)) {
    assert.ok(option.reference!.character);
    assert.ok(option.reference!.version);
    assert.ok(option.reference!.limitations.length > 100);
    assert.ok(option.sources!.length);
    for (const feat of option.reference!.feats) {
      assert.ok(feat.description && feat.context);
      assert.equal(new URL(feat.source.url).hostname, 'jujutsukaisen.jp');
    }
  }
});
