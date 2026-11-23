import test from 'node:test';
import assert from 'node:assert/strict';
import { wheels, getOption, getWheelProgress } from '../data/wheels.ts';
import { advancedSummary } from './advanced.ts';
import { forcedOutcome, isStageAvailable, playableWheel, resultDetails } from './conditions.ts';
import { gameReducer, initialState, parseSavedGame, type GameState } from './game.ts';
import { getSegments, landingRotation, pickOption } from './wheel.ts';

const stage = (id: string) => wheels.find((wheel) => wheel.id === id)!;
const ids = ['recovery', 'anti-domain', 'equipment'];
function oldSix(
  nature = 'human',
  condition = 'none',
  changes: Record<string, string> = {},
): GameState {
  const human = nature === 'human';
  const full = human && condition === 'physical-complete';
  const partial = human && condition === 'physical-partial';
  const energyUser = human || nature === 'cursed-spirit';
  const results: Record<string, string> = {
    nature,
    ...(human ? { lineage: 'no-known-clan', 'birth-condition': condition } : {}),
    strength: 'toji',
    speed: 'megumi',
    endurance: 'panda',
    ...(!full ? { 'energy-reserve': partial ? 'very-low' : 'high' } : {}),
    ...(energyUser && !full
      ? {
          'technique-presence': 'no',
          'energy-control': 'advanced',
          'energy-output': partial ? 'very-low' : 'high',
        }
      : {}),
    ...changes,
  };
  const stepId = full ? 'endurance' : energyUser ? 'energy-output' : 'energy-reserve';
  return { version: 3, phase: 'complete', stepId, results };
}
const start = (nature = 'human', condition = 'none', changes: Record<string, string> = {}) =>
  parseSavedGame(JSON.stringify(oldSix(nature, condition, changes)));
function advance(state: GameState, optionId: string): GameState {
  if (state.phase === 'revealed') {
    assert.ok(forcedOutcome(stage(state.stepId), state));
    assert.equal(state.results[state.stepId], optionId);
  } else {
    assert.equal(state.phase, 'ready');
    const spinning = gameReducer(state, { type: 'spin', optionId });
    assert.equal(spinning.phase, 'spinning');
    assert.strictEqual(gameReducer(spinning, { type: 'spin', optionId }), spinning);
    assert.strictEqual(gameReducer(spinning, { type: 'continue' }), spinning);
    assert.strictEqual(
      gameReducer(spinning, { type: 'retry', stepId: state.stepId, testMode: true }),
      spinning,
    );
    state = gameReducer(spinning, { type: 'reveal' });
    assert.deepEqual(parseSavedGame(JSON.stringify(spinning)), state);
    assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  }
  assert.strictEqual(gameReducer(state, { type: 'spin', optionId }), state);
  return gameReducer(state, { type: 'continue' });
}
function finish(state: GameState, choices: Record<string, string> = {}): GameState {
  for (let i = 0; state.phase !== 'complete' && ids.includes(state.stepId); i++) {
    assert.ok(i < ids.length);
    const options = playableWheel(stage(state.stepId), state).options;
    state = advance(state, choices[state.stepId] ?? options[0].id);
  }
  assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
  return state;
}

test('humans without innate techniques can learn RCT and defenses and receive equipment without rewriting earlier rolls', () => {
  const old = oldSix();
  const state = finish(start(), {
    recovery: 'heal-others',
    'anti-domain': 'simple-domain',
    equipment: 'playful-cloud',
  });
  assert.equal(state.phase, 'ready');
  assert.equal(state.stepId, 'barrier-knowledge');
  for (const [id, value] of Object.entries(old.results)) assert.equal(state.results[id], value);
  assert.equal(state.results['technique-presence'], 'no');
  assert.equal(state.results['innate-technique'], undefined);
  assert.equal(state.results['technique-proficiency'], undefined);
  assert.match(advancedSummary(state).join(' '), /força referenciada em Toji Fushiguro/);
  assert.match(advancedSummary(state).join(' '), /sem receber técnica inata/);
  assert.equal(
    getWheelProgress(stage('recovery'), state.results, (wheel) => isStageAvailable(wheel, state))
      .chapterNumber,
    7,
  );
});

test('learning RCT with Limitless does not grant Six Eyes, technique reversal or change earlier mastery', () => {
  const old = oldSix('human', 'none', {
    lineage: 'gojo',
    'technique-presence': 'yes',
    'innate-technique': 'limitless',
    'technique-proficiency': 'exceptional',
  });
  old.stepId = 'technique-proficiency';
  const complete = finish(parseSavedGame(JSON.stringify(old)), {
    recovery: 'self-advanced',
    'anti-domain': 'simple-domain',
    equipment: 'common-tool',
  });
  for (const [id, value] of Object.entries(old.results)) assert.equal(complete.results[id], value);
  assert.match(
    resultDetails('recovery', complete)!.reference!.initialUse!,
    /RCT não concede Reversão/,
  );
  assert.match(
    resultDetails('innate-technique', complete)!.reference!.limitations,
    /Seis Olhos não acompanha/,
  );
  assert.match(
    resultDetails('technique-proficiency', complete)!.reference!.initialUse!,
    /Não concede Seis Olhos nem garante utilização plena/,
  );
});

test('poor control and low stock limit effective RCT without deleting the randomly received repertoire', () => {
  for (const recovery of ['self-limited', 'self-advanced', 'heal-others']) {
    const poor = finish(start('human', 'none', { 'energy-control': 'poor' }), { recovery });
    assert.equal(poor.results.recovery, recovery);
    assert.match(
      resultDetails('recovery', poor)!.reference!.initialUse!,
      /sem recuperação confiável/,
    );
    assert.match(advancedSummary(poor).join(' '), /controle precário/);
    const scarce = finish(
      start('human', 'none', { 'energy-reserve': 'very-low', 'energy-output': 'low' }),
      { recovery },
    );
    assert.equal(scarce.results.recovery, recovery);
    assert.match(
      resultDetails('recovery', scarce)!.reference!.initialUse!,
      /tentativas pontuais de reparos limitados/,
    );
    assert.match(resultDetails('recovery', scarce)!.reference!.limitations, /Não|não/);
    if (recovery === 'heal-others')
      assert.match(
        resultDetails('recovery', scarce)!.reference!.initialUse!,
        /terceiros foi sorteado.*não é uma aplicação confiável/,
      );
  }
  const self = finish(start(), { recovery: 'self-advanced' });
  assert.match(resultDetails('recovery', self)!.description, /não concede cura de terceiros/);
  assert.match(
    resultDetails('recovery', self)!.reference!.initialUse!,
    /não concede Reversão|não é restauração ilimitada|RCT não concede Reversão/,
  );
  const none = finish(start());
  assert.equal(none.results.recovery, 'no-rct');
  assert.equal(none.results['energy-reserve'], 'high');
});

test('full restriction reaches equipment directly, with no healing or own-energy defense draw', () => {
  const original = Math.random;
  Math.random = () => {
    throw new Error('No RNG for automatic absence of own energy');
  };
  let ready: GameState;
  try {
    const old = oldSix('human', 'physical-complete');
    ready = parseSavedGame(JSON.stringify(old));
    assert.equal(ready.stepId, 'equipment');
    assert.equal(ready.phase, 'ready');
    assert.deepEqual(ready.results, old.results);
    for (const id of ['recovery', 'anti-domain']) {
      assert.equal(isStageAvailable(stage(id), ready), false);
      assert.match(resultDetails(id, ready)!.name, /energia própria ausente/);
      const forged = { ...ready, phase: 'ready' as const, stepId: id };
      assert.strictEqual(
        gameReducer(forged, { type: 'spin', optionId: stage(id).options[1].id }),
        forged,
      );
      assert.strictEqual(
        parseSavedGame(
          JSON.stringify({
            ...forged,
            phase: 'revealed',
            results: { ...ready.results, [id]: stage(id).options[1].id },
          }),
        ),
        initialState,
      );
    }
  } finally {
    Math.random = original;
  }
  const complete = finish(ready!, { equipment: 'inverted-spear' });
  assert.equal(complete.results['energy-reserve'], undefined);
  assert.match(
    resultDetails('equipment', complete)!.reference!.initialUse!,
    /sem exigir energia própria/,
  );
  assert.match(advancedSummary(complete).join(' '), /sem energia própria/);
});

test('partial restriction records two explicit consequences without RNG, waits for each reveal, then allows equipment', () => {
  const original = Math.random;
  Math.random = () => {
    throw new Error('Forced steps must not consume randomness');
  };
  try {
    const old = oldSix('human', 'physical-partial');
    const recovery = parseSavedGame(JSON.stringify(old));
    assert.equal(recovery.stepId, 'recovery');
    assert.equal(recovery.phase, 'revealed');
    assert.equal(recovery.results.recovery, 'no-rct');
    assert.equal(recovery.results['anti-domain'], undefined);
    assert.match(forcedOutcome(stage('recovery'), recovery)!.reason, /energia residual/);
    assert.strictEqual(gameReducer(recovery, { type: 'spin', optionId: 'heal-others' }), recovery);
    const defense = advance(recovery, 'no-rct');
    assert.equal(defense.phase, 'revealed');
    assert.equal(defense.stepId, 'anti-domain');
    assert.equal(defense.results['anti-domain'], 'none');
    assert.ok(forcedOutcome(stage('anti-domain'), defense));
    assert.strictEqual(
      gameReducer(defense, { type: 'retry', stepId: 'anti-domain', testMode: true }),
      defense,
    );
    const equipment = advance(defense, 'none');
    assert.equal(equipment.stepId, 'equipment');
    assert.equal(equipment.phase, 'ready');
    for (const [id, value] of Object.entries(old.results))
      assert.equal(equipment.results[id], value);
    assert.deepEqual(parseSavedGame(JSON.stringify(equipment)), equipment);
    const forged = { ...defense, results: { ...defense.results, recovery: 'self-advanced' } };
    assert.strictEqual(parseSavedGame(JSON.stringify(forged)), initialState);
  } finally {
    Math.random = original;
  }
});

test('Falling Blossom requires a great-family lineage while other trained defenses do not require an innate technique', () => {
  for (const lineage of ['no-known-clan', 'gojo', 'zenin', 'kamo', 'inumaki']) {
    const recovery = start('human', 'none', { lineage });
    const defense = advance(recovery, 'no-rct');
    const options = playableWheel(stage('anti-domain'), defense).options;
    assert.equal(
      options.some((option) => option.id === 'falling-blossom'),
      ['gojo', 'zenin', 'kamo'].includes(lineage),
    );
    assert.ok(options.some((option) => option.id === 'simple-domain'));
    assert.ok(options.some((option) => option.id === 'hollow-wicker-basket'));
    for (const option of options)
      assert.equal(
        finish(defense, { 'anti-domain': option.id }).results['technique-presence'],
        'no',
      );
    if (!['gojo', 'zenin', 'kamo'].includes(lineage)) {
      assert.strictEqual(
        gameReducer(defense, { type: 'spin', optionId: 'falling-blossom' }),
        defense,
      );
      const forged = {
        ...defense,
        phase: 'revealed',
        results: { ...defense.results, 'anti-domain': 'falling-blossom' },
      };
      assert.strictEqual(parseSavedGame(JSON.stringify(forged)), initialState);
    }
  }
});

test('defenses retain different mechanics, transmission requirements and current-energy limitations', () => {
  for (const id of ['simple-domain', 'hollow-wicker-basket', 'falling-blossom']) {
    const complete = finish(
      start('human', 'none', {
        lineage: 'gojo',
        'energy-control': 'poor',
        'energy-reserve': 'very-low',
      }),
      { 'anti-domain': id },
    );
    assert.match(
      resultDetails('anti-domain', complete)!.reference!.initialUse!,
      /instável ou breve/,
    );
    assert.equal(complete.results['anti-domain'], id);
  }
  const simple = getOption('anti-domain', 'simple-domain')!;
  assert.match(simple.reference!.limitations, /formação básica.*cap. 269/);
  assert.match(simple.reference!.limitations, /como a de Miwa, não uma limitação universal/);
  const basket = getOption('anti-domain', 'hollow-wicker-basket')!;
  assert.match(basket.reference!.limitations, /selo com as mãos/);
  assert.match(basket.description, /Não neutraliza diretamente/);
  const blossom = getOption('anti-domain', 'falling-blossom')!;
  assert.match(blossom.description, /não cria uma barreira/);
  assert.match(blossom.reference!.limitations, /três grandes famílias/);
});

test('Kokichi-type body limitations survive healing and equipment, without assigning a puppet', () => {
  const complete = finish(start('human', 'body-limited'), {
    recovery: 'heal-others',
    'anti-domain': 'simple-domain',
    equipment: 'playful-cloud',
  });
  assert.equal(complete.results['birth-condition'], 'body-limited');
  assert.equal(complete.results['innate-technique'], undefined);
  assert.match(
    resultDetails('recovery', complete)!.reference!.initialUse!,
    /Não remove a Restrição Celestial/,
  );
  assert.match(
    resultDetails('anti-domain', complete)!.reference!.initialUse!,
    /nenhuma cápsula, marionete/,
  );
  assert.match(
    resultDetails('equipment', complete)!.reference!.initialUse!,
    /Empunhadura direta: inviável/,
  );
  assert.match(advancedSummary(complete).join(' '), /Nenhuma marionete foi concedida/);
});

test('tools separate possession, wielding, mastery and special activation for every nature', () => {
  for (const nature of ['human', 'cursed-spirit', 'independent-cursed-corpse', 'simurian']) {
    const ready = start(nature);
    for (const option of stage('equipment').options) {
      const complete = finish(ready, { equipment: option.id });
      assert.equal(complete.results.equipment, option.id);
      if (option.id === 'none') continue;
      const detail = resultDetails('equipment', complete)!;
      assert.match(detail.reference!.initialUse!, /Posse: equipamento disponível/);
      assert.match(detail.reference!.initialUse!, /perícia em armas não foi sorteada/);
      if (nature !== 'human')
        assert.match(detail.reference!.initialUse!, /não presume uma fisiologia humana/);
      if (option.id === 'soul-katana')
        assert.match(detail.reference!.initialUse!, /Efeito pleno: bloqueado/);
      if (['playful-cloud', 'inverted-spear', 'soul-katana'].includes(option.id))
        assert.match(detail.notes!, /próprio artefato, não fabricação de réplica/);
    }
  }
  const full = finish(start('human', 'physical-complete'), { equipment: 'playful-cloud' });
  assert.match(
    resultDetails('equipment', full)!.reference!.initialUse!,
    /físico efetivo extraordinário/,
  );
  const ordinary = finish(start('human', 'physical-complete'), { equipment: 'conventional' });
  assert.match(
    resultDetails('equipment', ordinary)!.reference!.initialUse!,
    /não presume exorcismo/,
  );
});

test('spirit recomposition never becomes human RCT or automatic treatment of other beings', () => {
  const ready = start('cursed-spirit');
  const options = playableWheel(stage('recovery'), ready).options;
  assert.deepEqual(
    options.map((option) => option.id),
    ['spirit-untrained', 'spirit-limited', 'spirit-developed'],
  );
  assert.strictEqual(gameReducer(ready, { type: 'spin', optionId: 'heal-others' }), ready);
  for (const option of options) {
    const equipment = advance(ready, option.id);
    assert.equal(equipment.stepId, 'equipment');
    assert.equal(equipment.results['anti-domain'], undefined);
    assert.match(
      resultDetails('anti-domain', equipment)!.description,
      /não afirma incapacidade canônica/,
    );
    if (option.reference)
      assert.match(
        resultDetails('recovery', equipment)!.reference!.initialUse!,
        /não energia positiva de RCT/,
      );
    const complete = finish(equipment, { equipment: 'common-tool' });
    assert.equal(complete.results.recovery, option.id);
  }
});

test('corpses and simurians receive a nature-specific automatic recovery record and a real equipment wheel', () => {
  for (const [nature, outcome] of [
    ['independent-cursed-corpse', 'external-repair'],
    ['simurian', 'natural-recovery'],
  ]) {
    const original = Math.random;
    Math.random = () => {
      throw new Error('Nature consequences are automatic');
    };
    let equipment: GameState;
    try {
      const state = start(nature);
      assert.equal(state.phase, 'revealed');
      assert.equal(state.results.recovery, outcome);
      assert.ok(forcedOutcome(stage('recovery'), state));
      assert.deepEqual(parseSavedGame(JSON.stringify(state)), state);
      equipment = advance(state, outcome);
      assert.equal(equipment.phase, 'ready');
      assert.equal(equipment.stepId, 'equipment');
      assert.ok(playableWheel(stage('equipment'), equipment).options.length > 1);
      assert.equal(equipment.results['energy-reserve'], 'high');
    } finally {
      Math.random = original;
    }
    assert.equal(finish(equipment!, { equipment: 'inverted-spear' }).phase, 'complete');
  }
});

test('filtered odds, interval selection and wheel segments agree across all advanced paths', () => {
  const human = start();
  assert.deepEqual(
    getSegments(playableWheel(stage('recovery'), human).options).map((s) => s.probability),
    [0.65, 0.22, 0.1, 0.03],
  );
  assert.deepEqual(
    stage('equipment').options.map((option) => option.weight),
    [20, 20, 30, 20, 5, 3, 2],
  );
  for (const state of [
    human,
    start('human', 'none', { lineage: 'zenin' }),
    start('human', 'physical-partial'),
    start('human', 'physical-complete'),
    start('cursed-spirit'),
    start('simurian'),
    start('independent-cursed-corpse'),
  ]) {
    for (const id of ids) {
      if (!isStageAvailable(stage(id), state)) continue;
      const options = playableWheel(stage(id), state).options;
      const segments = getSegments(options);
      const counts = new Map<string, number>();
      if (options.length > 1)
        for (let i = 0; i < 10000; i++) {
          const option = pickOption(options, () => (i + 0.5) / 10000);
          counts.set(option.id, (counts.get(option.id) ?? 0) + 1);
        }
      for (const segment of segments) {
        if (options.length > 1)
          assert.ok(Math.abs(counts.get(segment.option.id)! - segment.probability * 10000) <= 1);
        assert.ok(Math.abs((segment.end - segment.start) / 360 - segment.probability) < 1e-10);
        assert.ok(Math.abs((segment.middle + landingRotation(segment)) % 360) < 1e-8);
      }
    }
  }
});

test('old completed games resume the first compatible advanced stage without losing earlier outcomes', () => {
  for (const [nature, condition] of [
    ['human', 'none'],
    ['human', 'physical-partial'],
    ['human', 'physical-complete'],
    ['human', 'body-limited'],
    ['cursed-spirit', 'none'],
    ['independent-cursed-corpse', 'none'],
    ['simurian', 'none'],
  ]) {
    const old = oldSix(nature, condition);
    const restored = parseSavedGame(JSON.stringify(old));
    assert.notEqual(restored.phase, 'intro');
    for (const [id, value] of Object.entries(old.results))
      assert.equal(restored.results[id], value);
    assert.deepEqual(parseSavedGame(JSON.stringify(restored)), restored);
    assert.equal(restored.stepId, condition === 'physical-complete' ? 'equipment' : 'recovery');
  }
  const old = oldSix();
  delete old.results['birth-condition'];
  old.legacyBirth = true;
  const migrated = parseSavedGame(JSON.stringify(old));
  assert.equal(migrated.legacyBirth, true);
  assert.deepEqual(migrated.results, old.results);
  assert.equal(migrated.stepId, 'recovery');
});

test('development retries invalidate advanced dependents while preserving earlier chapters and refusing forced rerolls', () => {
  const ready = start('human', 'none', { lineage: 'kamo' });
  const complete = finish(ready, {
    recovery: 'self-advanced',
    'anti-domain': 'falling-blossom',
    equipment: 'soul-katana',
  });
  for (const id of ids) {
    const retry = gameReducer(complete, { type: 'retry', stepId: id, testMode: true });
    const index = wheels.indexOf(stage(id));
    assert.equal(retry.phase, 'ready');
    assert.equal(retry.stepId, id);
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
  const partial = finish(start('human', 'physical-partial'));
  assert.strictEqual(
    gameReducer(partial, { type: 'retry', stepId: 'recovery', testMode: true }),
    partial,
  );
  const fromBirth = gameReducer(partial, {
    type: 'retry',
    stepId: 'birth-condition',
    testMode: true,
  });
  assert.equal(fromBirth.results.recovery, undefined);
  assert.equal(fromBirth.results['anti-domain'], undefined);
  assert.equal(fromBirth.results.equipment, undefined);
});

test('positive advanced outcomes carry contextual official reading references and use/limit information', () => {
  for (const id of ids)
    for (const option of stage(id).options) {
      if (!option.reference) continue;
      assert.equal(option.reference.topic, 'resource');
      assert.ok(option.description && option.reference.limitations && option.reference.version);
      assert.ok(option.reference.feats.length >= 1);
      for (const feat of option.reference.feats) {
        assert.ok(feat.description && feat.context && feat.source.label);
        assert.ok(['jujutsukaisen.jp', 'www.viz.com'].includes(new URL(feat.source.url).hostname));
      }
    }
});
