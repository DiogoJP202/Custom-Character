import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, wheels } from '../data/wheels.ts';
import { gameReducer, initialState, type GameState } from './game.ts';
import { playableWheel } from './conditions.ts';
import { characterProfile } from './character-profile.ts';
import { archiveStepIds, saveCharacter, type GalleryStorage } from './character-gallery.ts';
import {
  characterExportData,
  characterPngFilename,
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
} from './character-export.ts';

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
    equipment: 'none',
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
      const choice = choices[wheel.id];
      state = gameReducer(
        gameReducer(state, {
          type: 'spin',
          optionId: wheel.options.some((o) => o.id === choice) ? choice : wheel.options[0].id,
        }),
        { type: 'reveal' },
      );
    }
    state = gameReducer(state, { type: 'continue' });
  }
  return state;
}
const innate = (technique: string, changes: Record<string, string> = {}) =>
  complete({ 'technique-presence': 'yes', 'innate-technique': technique, ...changes });
const text = (data: ReturnType<typeof characterExportData>) => JSON.stringify(data);
const field = (data: ReturnType<typeof characterExportData>, label: string) =>
  data.facts.find((fact) => fact.label === label)?.value;

test('PNG filenames are predictable, bounded and safe for names, accents, separators and empty input', () => {
  for (const [name, expected] of [
    [undefined, 'personagem'],
    ['', 'personagem'],
    ['   ', 'personagem'],
    ['Tonny', 'tonny'],
    ['Personagem 03', 'personagem-03'],
    [' Júlia D’Ávila ', 'julia-d-avila'],
    ['../../CON:teste\\arquivo?.png', 'con-teste-arquivo-png'],
    ['名前 😀', 'personagem'],
  ] as const)
    assert.equal(characterPngFilename(name), `custom-character-${expected}.png`);
  const long = characterPngFilename('a'.repeat(200));
  assert.equal(long, `custom-character-${'a'.repeat(64)}.png`);
  assert.match(long, /^custom-character-[a-z0-9-]+\.png$/);
});

test('the active concluded export takes identity, facts, interpretations and assessments from the existing profile', () => {
  const state = innate('ten-shadows', {
    lineage: 'zenin',
    equipment: 'playful-cloud',
    'domain-expansion': 'chimera-shadow-garden',
  });
  const profile = characterProfile(state);
  const data = characterExportData(state, ' Renji   Kuroda ');
  assert.equal(data.name, 'Renji Kuroda');
  assert.equal(data.filename, 'custom-character-renji-kuroda.png');
  assert.equal(data.identity, profile.title);
  assert.equal(data.summary, profile.summary);
  assert.deepEqual(data.strengths, profile.strengths);
  assert.deepEqual(data.limitations, profile.limitations);
  assert.deepEqual(
    data.capabilities.map((cap) => cap.id),
    profile.capabilities.map((cap) => cap.id),
  );
  assert.equal(field(data, 'Natureza'), 'Humano');
  assert.match(field(data, 'Linhagem')!, /Zen/);
  assert.equal(field(data, 'Técnica inata'), 'Técnica das Dez Sombras');
  assert.equal(field(data, 'Equipamento'), 'Nuvem Brincalhona');
  assert.equal(field(data, 'Expansão de Domínio'), 'Jardim da Sombra Quimérica');
  assert.match(text(data), /incompleta.*não são confiáveis/);
  assert.match(text(data), /Mahoraga não é concedido/);
  assert.ok(!('results' in data) && !('sources' in data) && !('createdAt' in data));
  for (const cap of data.capabilities) {
    assert.ok(cap.paragraphs.length && cap.paragraphs.every(Boolean));
    const source = profile.capabilities
      .find((original) => original.id === cap.id)!
      .paragraphs.join(' ');
    for (const paragraph of cap.paragraphs)
      for (const sentence of paragraph.split(/(?<=[.!?])\s+/u))
        assert.ok(source.includes(sentence));
  }
});

test('unnamed characters use their derived identity, without making up a name or empty fact blocks', () => {
  const data = characterExportData(complete());
  assert.equal(data.name, undefined);
  assert.equal(data.filename, 'custom-character-personagem.png');
  assert.ok(data.identity);
  assert.equal(field(data, 'Técnica inata'), undefined);
  assert.equal(field(data, 'Equipamento'), undefined);
  assert.equal(field(data, 'Expansão de Domínio'), undefined);
  assert.match(text(data), /Não possui técnica inata/);
  assert.ok(data.capabilities.every((cap) => cap.paragraphs.length));
});

test('complete and partial restrictions keep effective physical and residual-energy consequences', () => {
  const full = characterExportData(
    complete({ 'birth-condition': 'physical-complete', equipment: 'inverted-spear' }),
  );
  assert.match(full.identity, /Combatente físico/);
  assert.match(text(full), /Sem energia própria/);
  assert.match(text(full), /capacidade corporal extraordinária/);
  assert.equal(field(full, 'Técnica inata'), undefined);
  assert.equal(field(full, 'Expansão de Domínio'), undefined);
  assert.equal(field(full, 'Equipamento'), 'Lança Invertida do Céu');
  const partial = characterExportData(
    innate('boogie-woogie', {
      'birth-condition': 'physical-partial',
      'energy-control': 'exceptional',
    }),
  );
  assert.match(text(partial), /Energia residual.*precisão.*potencial/);
  assert.match(text(partial), /energia residual.*limita|energia residual.*limitada/i);
  assert.ok(!partial.strengths.some((point) => /Controle refinado/.test(point)));
});

test('Kokichi-type body and tool restrictions survive compacting the existing descriptions', () => {
  const data = characterExportData(
    innate('puppet-manipulation', {
      'birth-condition': 'body-limited',
      equipment: 'soul-katana',
      recovery: 'heal-others',
      'energy-output': 'extraordinary',
    }),
  );
  assert.match(data.identity, /restrição corporal/);
  assert.match(text(data), /não pode ser empunhada diretamente|empunhadura direta é inviável/);
  assert.match(text(data), /Katana bloqueado/);
  assert.match(text(data), /corpo.*debilitado/i);
});

test('complete spirit domains remain complete with unreliable execution rather than acquiring an invented version', () => {
  const data = characterExportData(
    innate('idle-transfiguration', {
      nature: 'cursed-spirit',
      'energy-reserve': 'very-low',
      'energy-control': 'poor',
      'energy-output': 'very-low',
      'barrier-knowledge': 'untrained',
      'domain-expansion': 'self-embodiment-of-perfection',
    }),
  );
  assert.equal(field(data, 'Natureza'), 'Espírito amaldiçoado');
  assert.equal(field(data, 'Linhagem'), undefined);
  assert.equal(field(data, 'Expansão de Domínio'), 'Autoencarnação da Perfeição');
  assert.match(text(data), /manifestação completa.*não são confiáveis/);
  assert.match(text(data), /não a transformam.*incompleta inventada/);
});

test('corpses and simurians export only attributed groups, retaining their distinct nature and catalog note', () => {
  for (const nature of ['independent-cursed-corpse', 'simurian']) {
    const data = characterExportData(
      complete({ nature, equipment: 'common-tool', 'energy-reserve': 'immense' }),
    );
    assert.deepEqual(
      data.capabilities.map((cap) => cap.id),
      ['physical', 'energy', 'resources'],
    );
    assert.ok(data.catalogNote);
    assert.equal(field(data, 'Linhagem'), undefined);
    assert.equal(field(data, 'Técnica inata'), undefined);
    assert.equal(field(data, 'Expansão de Domínio'), undefined);
    assert.equal(field(data, 'Equipamento'), 'Ferramenta amaldiçoada comum');
    if (nature === 'simurian') assert.match(text(data), /rolloluca/);
    else assert.match(text(data), /corpo artificial/);
  }
});

test('archived and active characters use the same export data without modifying either storage slot', () => {
  const state = innate('boogie-woogie', { equipment: 'playful-cloud' });
  const memory = new Map<string, string>();
  const storage: GalleryStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
  };
  const saved = saveCharacter(state, 'Akio', storage);
  assert.ok(saved.ok && saved.record);
  const before = JSON.stringify([...memory]);
  assert.deepEqual(
    characterExportData(saved.record.snapshot, saved.record.name, archiveStepIds(saved.record)),
    characterExportData(state, 'Akio'),
  );
  assert.equal(JSON.stringify([...memory]), before);
});

test('historical archive scope exports without resuming a future chapter', () => {
  const state = complete();
  const scope = wheels.map((wheel) => wheel.id);
  const original = characterExportData(state, 'Histórico', scope);
  wheels.push({ ...wheels.at(-1)!, id: 'future-chapter-step' });
  try {
    assert.deepEqual(characterExportData(state, 'Histórico', scope), original);
  } finally {
    wheels.pop();
  }
});

test('export selection is deterministic and read-only and does not invoke gameplay RNG or invent a ninth chapter', () => {
  const states = [
    complete(),
    complete({ nature: 'simurian' }),
    complete({ 'birth-condition': 'physical-complete' }),
    innate('boogie-woogie'),
  ];
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('Export must not call gameplay randomness');
  };
  try {
    for (const state of states) {
      const before = JSON.stringify(state);
      Object.freeze(state.results);
      Object.freeze(state);
      const first = characterExportData(state, 'Teste');
      assert.deepEqual(characterExportData(state, 'Teste'), first);
      assert.equal(JSON.stringify(state), before);
    }
    assert.equal(chapters.length, 8);
    assert.equal(EXPORT_WIDTH, 1200);
    assert.equal(EXPORT_HEIGHT, 2160);
  } finally {
    Math.random = originalRandom;
  }
});

test('incomplete and incompatible snapshots cannot be exported as a finished character', () => {
  assert.throws(() => characterExportData(initialState), /Conclua uma ficha válida/);
  const state = complete();
  assert.throws(
    () => characterExportData({ ...state, phase: 'ready' }),
    /Conclua uma ficha válida/,
  );
  assert.throws(
    () =>
      characterExportData({
        ...state,
        results: { ...state.results, 'domain-expansion': 'coffin-of-the-iron-mountain' },
      }),
    /Conclua uma ficha válida/,
  );
});
