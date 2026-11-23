import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, wheels } from '../data/wheels.ts';
import { characterProfile } from './character-profile.ts';
import { gameReducer, initialState, parseSavedGame, STORAGE_KEY, type GameState } from './game.ts';
import { playableWheel, resultDetails } from './conditions.ts';

function complete(changes: Record<string, string> = {}): GameState {
  const choices: Record<string, string> = {
    nature: 'human',
    lineage: 'no-known-clan',
    'birth-condition': 'none',
    strength: 'megumi',
    speed: 'maki-goodwill',
    endurance: 'panda',
    'energy-reserve': 'high',
    'technique-presence': 'no',
    'energy-control': 'good',
    'energy-output': 'moderate',
    'technique-proficiency': 'beginner',
    recovery: 'no-rct',
    'anti-domain': 'none',
    equipment: 'common-tool',
    'barrier-knowledge': 'basic',
    'domain-expansion': 'none',
    ...changes,
  };
  let state = gameReducer(initialState, { type: 'start' });
  for (let i = 0; state.phase !== 'complete'; i++) {
    assert.ok(i < wheels.length);
    if (state.phase === 'ready') {
      const wheel = playableWheel(
        wheels.find((w) => w.id === state.stepId)!,
        state,
      );
      const optionId = wheel.options.some((o) => o.id === choices[wheel.id])
        ? choices[wheel.id]
        : wheel.options[0].id;
      state = gameReducer(gameReducer(state, { type: 'spin', optionId }), { type: 'reveal' });
    }
    assert.equal(state.phase, 'revealed');
    state = gameReducer(state, { type: 'continue' });
  }
  return state;
}
const text = (profile: ReturnType<typeof characterProfile>) => JSON.stringify(profile);
const capacity = (profile: ReturnType<typeof characterProfile>, id: string) =>
  profile.capabilities.find((c) => c.id === id)!.paragraphs.join(' ');
const innate = (id: string, changes: Record<string, string> = {}) =>
  complete({
    'technique-presence': 'yes',
    'innate-technique': id,
    ...changes,
  });

test('full Heavenly Restriction controls the physical profile and permits a cursed tool without granting training or own energy', () => {
  const saved = complete({ 'birth-condition': 'physical-complete', equipment: 'inverted-spear' });
  const profile = characterProfile(saved);
  assert.match(profile.title, /Combatente físico com Restrição Celestial/);
  assert.match(capacity(profile, 'physical'), /capacidade corporal extraordinária/);
  assert.match(capacity(profile, 'energy'), /Sem energia própria/);
  assert.match(capacity(profile, 'technique'), /proficiência não se aplica/);
  assert.match(capacity(profile, 'domain'), /Não pressupõe|não presume imunidade universal/);
  assert.match(capacity(profile, 'resources'), /Lança Invertida do Céu/);
  assert.match(
    profile.combatStyle.join(' '),
    /sem depender de energia própria.*sem receber a experiência de Toji/,
  );
  assert.match(profile.combatStyle.join(' '), /posse não concede perícia/);
  assert.ok(!profile.strengths.some((s) => /Controle refinado|Output elevado|Reserva/.test(s)));
  assert.match(profile.limitations.join(' '), /Sem energia própria/);
});

test('partial restriction keeps residual energy and amplified physical capability instead of transferring Toji reference rolls', () => {
  const saved = innate('ten-shadows', {
    lineage: 'zenin',
    'birth-condition': 'physical-partial',
    strength: 'toji',
    speed: 'toji',
    'energy-control': 'exceptional',
  });
  const original = JSON.stringify(saved);
  const profile = characterProfile(saved);
  assert.match(profile.title, /físico com energia residual/);
  assert.match(capacity(profile, 'physical'), /não.*patamar de Toji/);
  assert.match(capacity(profile, 'energy'), /Energia residual.*precisão.*potencial/);
  assert.match(capacity(profile, 'domain'), /energia residual.*limitada/);
  assert.ok(
    !profile.strengths.some((s) =>
      /Força bruta referenciada em Toji|Controle refinado|Output elevado/.test(s),
    ),
  );
  assert.equal(saved.results['energy-reserve'], 'very-low');
  assert.equal(saved.results['energy-output'], 'very-low');
  assert.equal(JSON.stringify(saved), original);
});

test('Kokichi-type body limitations prevent direct equipment use even with high references, healing and excellent energy', () => {
  for (const equipment of wheels
    .find((w) => w.id === 'equipment')!
    .options.filter((o) => o.id !== 'none')) {
    const saved = complete({
      'birth-condition': 'body-limited',
      strength: 'toji',
      speed: 'toji',
      equipment: equipment.id,
      recovery: 'heal-others',
      'energy-control': 'exceptional',
      'energy-output': 'extraordinary',
    });
    const profile = characterProfile(saved);
    assert.match(profile.title, /restrição corporal/);
    assert.match(capacity(profile, 'physical'), /corpo extremamente debilitado/);
    assert.match(capacity(profile, 'resources'), /não pode ser empunhada diretamente/);
    assert.match(
      profile.combatStyle.join(' '),
      /empunhadura direta é inviável.*não recebe uma marionete/,
    );
    assert.match(profile.limitations.join(' '), /sem empunhadura direta viável/);
    assert.ok(!profile.strengths.some((s) => /Força bruta|Arrancadas|Posse de ferramenta/.test(s)));
    assert.match(capacity(profile, 'energy'), /não reparam o corpo/);
  }
});

test('a human without an innate technique retains energy, defenses and tools without receiving a technique retroactively', () => {
  const saved = complete({ 'anti-domain': 'simple-domain', equipment: 'playful-cloud' });
  const profile = characterProfile(saved);
  assert.equal(saved.results['innate-technique'], undefined);
  assert.equal(saved.results['technique-proficiency'], undefined);
  assert.match(capacity(profile, 'technique'), /Não possui técnica inata.*recursos gerais/);
  assert.match(
    capacity(profile, 'resources'),
    /Domínio Simples.*sem vitória garantida.*Nuvem Brincalhona/,
  );
  assert.match(profile.combatStyle.join(' '), /Sem técnica inata.*aplicações gerais/);
  assert.match(profile.strengths.join(' '), /Domínio Simples/);
});

test('Boogie Woogie with poor control remains learned but inconsistent, without receiving Todo tactical experience', () => {
  const profile = characterProfile(innate('boogie-woogie', { 'energy-control': 'poor' }));
  assert.match(profile.title, /técnica em desenvolvimento/);
  assert.match(
    profile.combatStyle.join(' '),
    /Boogie Woogie.*controle precário.*execução instável/,
  );
  assert.match(
    profile.combatStyle.join(' '),
    /condições da técnica.*não recebe a experiência tática de Todo/,
  );
  assert.match(profile.limitations.join(' '), /controle precário.*limita.*Proficiência inicial/i);
  assert.match(capacity(profile, 'technique'), /Boogie Woogie.*iniciante/);
});

test('an immense reserve with low output affects identity and style without increasing immediate release', () => {
  const profile = characterProfile(
    complete({ 'energy-reserve': 'immense', 'energy-output': 'low' }),
  );
  assert.match(profile.title, /reserva ampla e output limitado/);
  assert.match(profile.summary, /bastante energia.*pouca.*liberada de uma vez/);
  assert.match(profile.combatStyle.join(' '), /estoque amplo.*continuidade.*output baixo limita/);
  assert.match(profile.strengths.join(' '), /Reserva imensa.*finita/);
  assert.match(profile.limitations.join(' '), /output baixo/i);
  assert.ok(!profile.strengths.some((s) => /Output elevado/.test(s)));
});

test('a very low reserve and refined control preserve precision while limiting sustained use', () => {
  const profile = characterProfile(
    complete({
      'energy-reserve': 'very-low',
      'energy-control': 'exceptional',
      'energy-output': 'high',
    }),
  );
  assert.match(profile.summary, /precisão.*estoque continua muito limitado/);
  assert.match(
    capacity(profile, 'energy'),
    /descargas relativamente intensas.*consumir rapidamente/,
  );
  assert.match(profile.combatStyle.join(' '), /controle refinado.*reserva muito baixa limita/);
  assert.match(profile.strengths.join(' '), /Controle refinado.*sem multiplicar/);
  assert.match(profile.limitations.join(' '), /Reserva muito baixa/);
});

test('beginner Ten Shadows does not grant all shikigami, Mahoraga or complete domain mastery', () => {
  const profile = characterProfile(
    innate('ten-shadows', { lineage: 'zenin', 'domain-expansion': 'chimera-shadow-garden' }),
  );
  assert.match(
    capacity(profile, 'technique'),
    /Cães Divinos.*Não recebe todos os shikigamis.*Mahoraga não é concedido/,
  );
  assert.match(capacity(profile, 'domain'), /manifestação incompleta.*não são confiáveis/);
  assert.match(
    capacity(profile, 'domain'),
    /sem barreira fechada convencional ou acerto garantido/,
  );
  assert.match(profile.limitations.join(' '), /domínio recebido.*não confiáveis/);
});

test('Chimera Shadow Garden stays incomplete even with all exceptional resources', () => {
  const profile = characterProfile(
    innate('ten-shadows', {
      lineage: 'zenin',
      'energy-reserve': 'immense',
      'energy-control': 'exceptional',
      'energy-output': 'extraordinary',
      'technique-proficiency': 'exceptional',
      'barrier-knowledge': 'advanced',
      'domain-expansion': 'chimera-shadow-garden',
    }),
  );
  assert.match(
    capacity(profile, 'domain'),
    /manifestação incompleta documentada.*permanece incompleta.*recinto compatível/,
  );
  assert.ok(!profile.limitations.some((s) => /ativação e manutenção ainda não confiáveis/.test(s)));
  assert.match(profile.summary, /acesso, não como ativação garantida/);
});

test('a complete spirit domain with insufficient resources remains complete but unreliable', () => {
  for (const [technique, domain] of [
    ['idle-transfiguration', 'self-embodiment-of-perfection'],
    ['jogo-flames', 'coffin-of-the-iron-mountain'],
  ]) {
    const profile = characterProfile(
      innate(technique, {
        nature: 'cursed-spirit',
        'domain-expansion': domain,
        'energy-reserve': 'very-low',
        'energy-control': 'poor',
        'energy-output': 'very-low',
        'barrier-knowledge': 'untrained',
      }),
    );
    assert.match(profile.title, /Espírito amaldiçoado com técnica própria/);
    assert.match(
      capacity(profile, 'domain'),
      /manifestação completa documentada.*não são confiáveis/,
    );
    assert.match(capacity(profile, 'domain'), /não a transformam.*incompleta inventada/);
    assert.match(profile.limitations.join(' '), /ativação e manutenção ainda não confiáveis/);
    assert.match(profile.combatStyle.join(' '), /Acesso desenvolvido.*não são confiáveis/);
  }
});

test('the Split Soul Katana remains a possession with its full effect blocked and Limitless never grants Six Eyes', () => {
  const profile = characterProfile(
    innate('limitless', {
      lineage: 'gojo',
      equipment: 'soul-katana',
      'technique-proficiency': 'exceptional',
    }),
  );
  assert.match(
    profile.limitations.join(' '),
    /Katana bloqueado.*percepção de almas.*Ilimitado não concede Seis Olhos/,
  );
  assert.match(capacity(profile, 'resources'), /efeito pleno.*bloqueado/);
  assert.match(capacity(profile, 'domain'), /Vazio Infinito não é atribuído/);
  assert.match(capacity(profile, 'technique'), /Não concede Seis Olhos/);
});

test('RCT and recomposition keep the existing effective execution constraints in the final profile', () => {
  for (const [nature, recovery] of [
    ['human', 'heal-others'],
    ['cursed-spirit', 'spirit-developed'],
  ]) {
    const saved = complete({ nature, recovery, 'energy-control': 'poor' });
    const profile = characterProfile(saved);
    assert.match(capacity(profile, 'resources'), /controle precário impede execução confiável/);
    assert.match(profile.combatStyle.join(' '), /sem recuperação confiável/);
    assert.match(profile.limitations.join(' '), /sem execução confiável com controle precário/);
    assert.equal(saved.results.recovery, recovery);
    if (nature === 'cursed-spirit')
      assert.ok(!capacity(profile, 'resources').includes('Técnica Reversa'));
  }
});

test('nonhuman dossiers emphasize attributed capabilities, with a single catalog note and no human physiology presumed', () => {
  for (const nature of ['independent-cursed-corpse', 'simurian']) {
    const saved = complete({ nature, 'energy-reserve': 'immense', equipment: 'inverted-spear' });
    const profile = characterProfile(saved);
    assert.deepEqual(
      profile.capabilities.map((c) => c.id),
      ['physical', 'energy', 'resources'],
    );
    assert.equal(profile.facts.length, 1);
    assert.equal(profile.facts[0].value, resultDetails('nature', saved)!.name);
    assert.ok(profile.catalogNote);
    assert.match(profile.catalogNote, /não significa incapacidade no cânone/);
    assert.ok(!text(profile).includes('não catalogado'));
    assert.match(profile.combatStyle.join(' '), /anatomia e pegada compatíveis/);
    assert.match(capacity(profile, 'resources'), /Lança Invertida do Céu/);
    assert.ok(!profile.capabilities.some((c) => c.steps.includes('anti-domain')));
    if (nature === 'simurian') {
      assert.match(capacity(profile, 'energy'), /rolloluca imensa.*não define output/);
      assert.match(profile.summary, /rolloluca/);
    } else
      assert.match(capacity(profile, 'energy'), /corpo artificial.*Não concede núcleos extras/);
  }
});

test('completed pre-profile saves load the final dossier without adding stages, RNG calls or stored fields', () => {
  const originalRandom = Math.random;
  const saves = [
    complete(),
    complete({ nature: 'simurian' }),
    complete({ nature: 'independent-cursed-corpse' }),
    innate('idle-transfiguration', {
      nature: 'cursed-spirit',
      'domain-expansion': 'self-embodiment-of-perfection',
    }),
    complete({ 'birth-condition': 'physical-complete' }),
  ];
  const catalog = JSON.stringify(wheels);
  Math.random = () => {
    throw new Error('The profile must never consume randomness');
  };
  try {
    for (const saved of saves) {
      const restored = parseSavedGame(JSON.stringify(saved));
      assert.deepEqual(restored, saved);
      assert.equal(restored.phase, 'complete');
      const restoredRaw = JSON.stringify(restored);
      const profile = characterProfile(restored);
      assert.ok(profile.title && profile.capabilities.length && profile.combatStyle.length);
      assert.equal(JSON.stringify(restored), restoredRaw);
    }
    assert.equal(JSON.stringify(wheels), catalog);
    assert.equal(chapters.length, 8);
    assert.equal(STORAGE_KEY, 'jjk-spinner:v1');
  } finally {
    Math.random = originalRandom;
  }
});

test('a migrated human save keeps the unrecorded birth condition instead of inventing one', () => {
  const saved = complete();
  delete saved.results['birth-condition'];
  saved.legacyBirth = true;
  const restored = parseSavedGame(JSON.stringify(saved));
  assert.equal(restored.phase, 'complete');
  assert.deepEqual(restored, saved);
  const profile = characterProfile(restored);
  assert.ok(
    profile.facts.some(
      (f) => f.label === 'Condição de nascimento' && f.value.includes('Não registrada'),
    ),
  );
  assert.equal(restored.results['birth-condition'], undefined);
});

test('profile generation is deterministic, read-only and independent of result insertion order', () => {
  for (const saved of [
    complete(),
    complete({ nature: 'simurian' }),
    innate('boogie-woogie'),
    complete({ 'birth-condition': 'physical-complete' }),
  ]) {
    const before = JSON.stringify(saved);
    Object.freeze(saved.results);
    Object.freeze(saved);
    const first = characterProfile(saved);
    const reordered = {
      ...saved,
      results: Object.fromEntries(Object.entries(saved.results).reverse()),
    };
    assert.deepEqual(characterProfile(saved), first);
    assert.deepEqual(characterProfile(reordered), first);
    assert.equal(JSON.stringify(saved), before);
    assert.ok(first.strengths.length <= 4 && first.limitations.length <= 4);
    assert.equal(new Set(first.strengths).size, first.strengths.length);
    assert.equal(new Set(first.limitations).size, first.limitations.length);
  }
});
