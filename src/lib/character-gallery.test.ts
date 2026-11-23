import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'vite';
import { wheels } from '../data/wheels.ts';
import { characterProfile } from './character-profile.ts';
import { gameReducer, initialState, parseSavedGame, STORAGE_KEY, type GameState } from './game.ts';
import { playableWheel, resultDetails } from './conditions.ts';
import {
  archiveStepIds,
  deleteCharacter,
  findSavedCharacter,
  GALLERY_CATALOG_END,
  GALLERY_STORAGE_KEY,
  loadGallery,
  MAX_CHARACTERS,
  normalizeCharacterName,
  parseGallery,
  renameCharacter,
  saveCharacter,
  type GalleryResult,
  type GalleryStorage,
} from './character-gallery.ts';

class MemoryStorage implements GalleryStorage {
  data = new Map<string, string>();
  writes = 0;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.writes++;
    this.data.set(key, value);
  }
}
function completed(changes: Record<string, string> = {}): GameState {
  const choices = {
    nature: 'human',
    lineage: 'no-known-clan',
    'birth-condition': 'none',
    'technique-presence': 'no',
    equipment: 'common-tool',
    ...changes,
  };
  let state = gameReducer(initialState, { type: 'start' });
  for (let i = 0; state.phase !== 'complete'; i++) {
    assert.ok(i < wheels.length);
    if (state.phase === 'ready') {
      const wheel = playableWheel(
        wheels.find((wheel) => wheel.id === state.stepId)!,
        state,
      );
      const choice = choices[state.stepId as keyof typeof choices];
      const optionId = wheel.options.some((o) => o.id === choice) ? choice : wheel.options[0].id;
      state = gameReducer(gameReducer(state, { type: 'spin', optionId }), { type: 'reveal' });
    }
    state = gameReducer(state, { type: 'continue' });
  }
  return state;
}
function successful(result: GalleryResult) {
  assert.ok(result.ok, result.ok ? '' : result.error);
  return result;
}
function failed(result: GalleryResult) {
  assert.equal(result.ok, false);
  return result.ok ? '' : result.error;
}

test('a completed character is explicitly saved with a stable ID, metadata and a detached validated snapshot only', () => {
  const storage = new MemoryStorage();
  const state = completed();
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
  const active = storage.getItem(STORAGE_KEY);
  Object.freeze(state.results);
  Object.freeze(state);
  assert.deepEqual(loadGallery(storage), { records: [] });
  const result = successful(saveCharacter(state, '  Akira   Zen  ', storage));
  assert.equal(result.record!.name, 'Akira Zen');
  assert.equal(result.record!.version, 1);
  assert.match(result.record!.id, /^[0-9a-f-]{36}$/);
  assert.equal(new Date(result.record!.createdAt).toISOString(), result.record!.createdAt);
  assert.equal(result.record!.catalogEnd, GALLERY_CATALOG_END);
  assert.deepEqual(result.record!.snapshot, state);
  assert.notStrictEqual(result.record!.snapshot.results, state.results);
  assert.deepEqual(
    Object.keys(JSON.parse(storage.getItem(GALLERY_STORAGE_KEY)!).characters[0]).sort(),
    ['catalogEnd', 'createdAt', 'id', 'name', 'snapshot', 'version'],
  );
  assert.equal(storage.getItem(STORAGE_KEY), active);
  assert.deepEqual(loadGallery(storage).records, result.gallery.records);
});

test('incomplete, interrupted and impossible games cannot be archived', () => {
  const storage = new MemoryStorage();
  const finished = completed();
  for (const state of [
    initialState,
    gameReducer(initialState, { type: 'start' }),
    { ...finished, phase: 'spinning' as const },
    { ...finished, phase: 'revealed' as const },
    { ...finished, results: { ...finished.results, 'domain-expansion': 'chimera-shadow-garden' } },
  ]) {
    failed(saveCharacter(state, '', storage));
    assert.equal(storage.getItem(GALLERY_STORAGE_KEY), null);
  }
});

test('repeated saves and reloads deduplicate identical results regardless of object order, without another write or rename', () => {
  const storage = new MemoryStorage();
  const state = completed();
  const first = successful(saveCharacter(state, 'Primeiro', storage));
  const writes = storage.writes;
  for (const current of [
    state,
    parseSavedGame(JSON.stringify(state)),
    { ...state, results: Object.fromEntries(Object.entries(state.results).reverse()) },
  ]) {
    const repeat = successful(saveCharacter(current, 'Não sobrescrever o nome', storage));
    assert.equal(repeat.duplicate, true);
    assert.equal(repeat.record!.id, first.record!.id);
    assert.equal(repeat.record!.name, 'Primeiro');
    assert.equal(repeat.gallery.records.length, 1);
    assert.equal(storage.writes, writes);
    assert.equal(findSavedCharacter(repeat.gallery.records, current)?.id, first.record!.id);
  }
});

test('optional default names are predictable and separate from gameplay; normalization and length limits apply to rename', () => {
  const storage = new MemoryStorage();
  const one = successful(saveCharacter(completed(), ' \n ', storage));
  const two = successful(saveCharacter(completed({ nature: 'simurian' }), '', storage));
  assert.equal(one.record!.name, 'Personagem 01');
  assert.equal(two.record!.name, 'Personagem 02');
  assert.equal(normalizeCharacterName(' \tNome\n  próprio  '), 'Nome próprio');
  assert.equal(normalizeCharacterName('e\u0301'), 'é');
  assert.throws(() => normalizeCharacterName('a'.repeat(61)), /60/);
  assert.match(failed(renameCharacter(one.record!.id, '  ', storage)), /Informe um nome/);
  const before = storage.getItem(GALLERY_STORAGE_KEY);
  failed(renameCharacter(one.record!.id, 'a'.repeat(61), storage));
  assert.equal(storage.getItem(GALLERY_STORAGE_KEY), before);
});

test('renaming edits only metadata, keeps identity and date, and treats markup as a literal name', () => {
  const storage = new MemoryStorage();
  const initial = successful(saveCharacter(completed(), '', storage)).record!;
  const renamed = successful(renameCharacter(initial.id, ' <b>   Nome </b> ', storage)).gallery
    .records[0];
  assert.equal(renamed.name, '<b> Nome </b>');
  assert.equal(renamed.id, initial.id);
  assert.equal(renamed.createdAt, initial.createdAt);
  assert.deepEqual(renamed.snapshot, initial.snapshot);
  assert.deepEqual(characterProfile(renamed.snapshot), characterProfile(initial.snapshot));
  assert.match(failed(renameCharacter(crypto.randomUUID(), 'Ausente', storage)), /não está mais/);
});

test('deletion requires explicit confirmation and affects neither another record nor the active creation', () => {
  const storage = new MemoryStorage();
  const first = successful(saveCharacter(completed(), 'A', storage)).record!;
  const second = successful(saveCharacter(completed({ nature: 'simurian' }), 'B', storage)).record!;
  const active = gameReducer(initialState, { type: 'start' });
  storage.setItem(STORAGE_KEY, JSON.stringify(active));
  const before = storage.getItem(GALLERY_STORAGE_KEY);
  failed(deleteCharacter(first.id, false, storage));
  assert.equal(storage.getItem(GALLERY_STORAGE_KEY), before);
  const result = successful(deleteCharacter(first.id, true, storage));
  assert.deepEqual(result.gallery.records, [second]);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!), active);
  failed(deleteCharacter(first.id, true, storage));
});

test('a new creation resets only the active slot; consulting and profiling archives never replaces it', () => {
  const storage = new MemoryStorage();
  const original = completed();
  const saved = successful(saveCharacter(original, '', storage)).record!;
  const collection = storage.getItem(GALLERY_STORAGE_KEY);
  const active = gameReducer(original, { type: 'reset' });
  storage.setItem(STORAGE_KEY, JSON.stringify(active));
  const record = loadGallery(storage).records[0];
  assert.deepEqual(characterProfile(record.snapshot), characterProfile(original));
  assert.equal(record.id, saved.id);
  assert.equal(record.snapshot.phase, 'complete');
  assert.equal(storage.getItem(GALLERY_STORAGE_KEY), collection);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!), active);
});

test('future appended stages resume active games but never force historical archives into new draws', () => {
  const storage = new MemoryStorage();
  const original = completed();
  successful(saveCharacter(original, '', storage));
  const extra = { ...wheels.at(-1)!, id: 'future-stage' };
  wheels.push(extra);
  try {
    assert.equal(parseSavedGame(JSON.stringify(original)).stepId, 'future-stage');
    const gallery = loadGallery(storage);
    assert.equal(gallery.error, undefined);
    const record = gallery.records[0];
    assert.deepEqual(record.snapshot, original);
    assert.equal(record.snapshot.phase, 'complete');
    assert.ok(!archiveStepIds(record).includes('future-stage'));
    assert.ok(
      characterProfile(record.snapshot, archiveStepIds(record)).capabilities.every(
        (cap) => !cap.steps.includes('future-stage'),
      ),
    );
  } finally {
    wheels.pop();
  }
});

test('corrupt JSON and unknown collection versions are preserved and block all mutations', () => {
  const storage = new MemoryStorage();
  for (const raw of ['{bad', 'null', '[]', JSON.stringify({ version: 99, characters: [] })]) {
    storage.data.set(GALLERY_STORAGE_KEY, raw);
    assert.ok(loadGallery(storage).error);
    failed(saveCharacter(completed(), '', storage));
    failed(renameCharacter('missing', 'Nome', storage));
    failed(deleteCharacter('missing', true, storage));
    assert.equal(storage.getItem(GALLERY_STORAGE_KEY), raw);
  }
});

test('malformed, duplicate and unsupported records do not become silently accepted characters or get overwritten', () => {
  const storage = new MemoryStorage();
  const valid = successful(saveCharacter(completed(), 'Válido', storage)).record!;
  const invalidRecords = [
    null,
    { ...valid, version: 2 },
    { ...valid, id: 'invalid' },
    { ...valid, name: '' },
    { ...valid, name: '  Espaços  ' },
    { ...valid, createdAt: 'yesterday' },
    { ...valid, catalogEnd: 'nature' },
    { ...valid, profile: '<html>Derived data</html>' },
    { ...valid, snapshot: { ...valid.snapshot, phase: 'ready' } },
    {
      ...valid,
      snapshot: {
        ...valid.snapshot,
        results: { ...valid.snapshot.results, 'domain-expansion': 'chimera-shadow-garden' },
      },
    },
    { ...valid, id: crypto.randomUUID() },
    { ...valid, snapshot: completed({ nature: 'simurian' }) },
    valid,
  ];
  for (const invalid of invalidRecords) {
    const raw = JSON.stringify({ version: 1, characters: [valid, invalid] });
    storage.data.set(GALLERY_STORAGE_KEY, raw);
    const parsed = loadGallery(storage);
    assert.ok(parsed.error);
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.records[0].id, valid.id);
    failed(saveCharacter(completed({ nature: 'simurian' }), '', storage));
    assert.equal(storage.getItem(GALLERY_STORAGE_KEY), raw);
  }
});

test('the configured capacity is enforced without overwrites and duplicate saving remains idempotent at the limit', () => {
  const storage = new MemoryStorage();
  for (let i = 0; i < MAX_CHARACTERS; i++) {
    const choices = {
      strength: ['megumi', 'panda', 'maki-goodwill', 'todo', 'yuji-goodwill', 'toji'][i % 6],
      speed: ['megumi', 'maki-goodwill', 'yuji-goodwill', 'todo', 'toji'][Math.floor(i / 6)],
    };
    successful(saveCharacter(completed(choices), '', storage));
  }
  assert.equal(loadGallery(storage).records.length, 30);
  const raw = storage.getItem(GALLERY_STORAGE_KEY);
  assert.match(
    failed(saveCharacter(completed({ nature: 'simurian' }), '', storage)),
    /limite de 30/,
  );
  assert.equal(storage.getItem(GALLERY_STORAGE_KEY), raw);
  const repeat = successful(
    saveCharacter(completed({ speed: 'megumi', strength: 'megumi' }), '', storage),
  );
  assert.equal(repeat.duplicate, true);
  assert.equal(storage.getItem(GALLERY_STORAGE_KEY), raw);
});

test('read and quota failures return real errors without a successful mutation or optimistic collection', () => {
  const unreadable: GalleryStorage = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      assert.fail('No write after failed read');
    },
  };
  assert.ok(loadGallery(unreadable).error);
  failed(saveCharacter(completed(), '', unreadable));
  const storage = new MemoryStorage();
  const saved = successful(saveCharacter(completed(), 'Existente', storage)).record!;
  const raw = storage.getItem(GALLERY_STORAGE_KEY);
  const quota: GalleryStorage = {
    getItem: storage.getItem.bind(storage),
    setItem() {
      throw new Error('QuotaExceededError');
    },
  };
  for (const result of [
    saveCharacter(completed({ nature: 'simurian' }), '', quota),
    renameCharacter(saved.id, 'Outro', quota),
    deleteCharacter(saved.id, true, quota),
  ]) {
    assert.match(failed(result), /Não foi possível salvar/);
    assert.equal(storage.getItem(GALLERY_STORAGE_KEY), raw);
  }
});

test('each mutation rereads the latest collection, preserving changes made by a second tab', () => {
  const storage = new MemoryStorage();
  const first = successful(saveCharacter(completed(), 'Primeiro', storage)).record!;
  const staleView = loadGallery(storage);
  const second = successful(
    saveCharacter(completed({ nature: 'simurian' }), 'Outra aba', storage),
  ).record!;
  assert.equal(staleView.records.length, 1);
  const renamed = successful(renameCharacter(first.id, 'Atualizado', storage));
  assert.equal(renamed.gallery.records.length, 2);
  assert.deepEqual(renamed.gallery.records[1], second);
  successful(deleteCharacter(second.id, true, storage));
  assert.equal(loadGallery(storage).records[0].name, 'Atualizado');
});

test('migrated completed humans and all nonhuman natures keep snapshots and profiles without any gameplay RNG', () => {
  const migrated = completed();
  delete migrated.results['birth-condition'];
  migrated.legacyBirth = true;
  const states = [
    migrated,
    completed({ nature: 'cursed-spirit' }),
    completed({ nature: 'independent-cursed-corpse' }),
    completed({ nature: 'simurian' }),
  ];
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('No gameplay RNG while archiving or reading');
  };
  try {
    const storage = new MemoryStorage();
    for (const state of states) {
      const saved = successful(saveCharacter(state, '', storage)).record!;
      assert.deepEqual(saved.snapshot, state);
      assert.deepEqual(characterProfile(saved.snapshot), characterProfile(state));
      for (const cap of characterProfile(saved.snapshot).capabilities)
        for (const id of cap.steps) assert.ok(resultDetails(id, saved.snapshot));
    }
    assert.equal(loadGallery(storage).records.length, 4);
  } finally {
    Math.random = originalRandom;
  }
});

test('every profile detail link resolves to content, including consequences, with absent and historical steps omitted', () => {
  for (const state of [
    completed(),
    completed({ 'birth-condition': 'physical-complete' }),
    completed({ 'birth-condition': 'physical-partial' }),
    completed({ 'birth-condition': 'body-limited' }),
    completed({ nature: 'simurian' }),
    completed({ nature: 'independent-cursed-corpse' }),
  ]) {
    for (const cap of characterProfile(state).capabilities)
      for (const step of cap.steps) assert.ok(resultDetails(step, state));
    const scope = ['nature', 'lineage'];
    assert.ok(
      characterProfile(state, scope).capabilities.every((cap) =>
        cap.steps.every((step) => scope.includes(step)),
      ),
    );
  }
  assert.deepEqual(characterProfile({ results: { nature: 'human' } }).capabilities, []);
  assert.deepEqual(parseGallery(null), { records: [] });
});

test('the actual final-sheet component refuses all game actions in archive mode even with development and forged callbacks', async () => {
  const require = createRequire(import.meta.url);
  const externals = ['react', 'react/jsx-runtime'];
  const bundle = await build({
    configFile: false,
    logLevel: 'silent',
    define: { 'import.meta.env.DEV': 'true' },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('../components/FinalCharacterSheet.tsx', import.meta.url)),
        formats: ['es'],
      },
      rolldownOptions: {
        external: externals,
        output: {
          paths: Object.fromEntries(
            externals.map((id) => [id, pathToFileURL(require.resolve(id)).href]),
          ),
        },
      },
    },
  });
  const output = Array.isArray(bundle) ? bundle[0] : bundle;
  assert.ok('output' in output);
  const entry = output.output.find((item) => item.type === 'chunk' && item.isEntry);
  assert.ok(entry && entry.type === 'chunk');
  const { default: FinalCharacterSheet } = await import(
    `data:text/javascript;base64,${Buffer.from(entry.code).toString('base64')}`
  );
  const state = completed();
  const original = JSON.stringify(state);
  const props = {
    state,
    characterName: '<img src=x onerror=alert(1)>',
    onInspect() {},
    onReset() {
      assert.fail('No reset');
    },
    onSave() {
      assert.fail('No save');
    },
    onRetry() {
      assert.fail('No retry');
    },
  };
  const editable = renderToStaticMarkup(createElement(FinalCharacterSheet, props));
  assert.match(editable, /Tentar novamente/);
  const archived = renderToStaticMarkup(
    createElement(FinalCharacterSheet, { ...props, readOnly: true }),
  );
  assert.doesNotMatch(
    archived,
    /Tentar novamente|Criar outro personagem|Salvar na galeria|profile-actions/,
  );
  assert.match(archived, /&lt;img src=x/);
  assert.doesNotMatch(archived, /<img/);
  assert.equal(JSON.stringify(state), original);
});
