import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

test('the actual production reducer rejects retries even with a forged testMode flag', async () => {
  const bundle = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('./game.ts', import.meta.url)),
        formats: ['es'],
      },
    },
  });
  const output = Array.isArray(bundle) ? bundle[0] : bundle;
  assert.ok('output' in output);
  const entry = output.output.find((item) => item.type === 'chunk' && item.isEntry);
  assert.ok(entry && entry.type === 'chunk');
  const { gameReducer, parseSavedGame } = await import(
    `data:text/javascript;base64,${Buffer.from(entry.code).toString('base64')}`
  );
  const saved = {
    version: 3,
    phase: 'complete',
    stepId: 'equipment',
    results: {
      nature: 'simurian',
      strength: 'megumi',
      speed: 'toji',
      endurance: 'hanami',
      'energy-reserve': 'immense',
      recovery: 'natural-recovery',
      equipment: 'none',
    },
  };
  const state = parseSavedGame(JSON.stringify(saved));
  assert.deepEqual(state, saved);
  for (const stepId of Object.keys(state.results)) {
    for (const testMode of [true, false, 'true', 1]) {
      assert.strictEqual(gameReducer(state, { type: 'retry', stepId, testMode }), state);
    }
  }
  assert.equal(gameReducer(state, { type: 'reset' }).phase, 'ready');
  const spinning = gameReducer(gameReducer(state, { type: 'reset' }), {
    type: 'spin',
    optionId: 'human',
  });
  assert.deepEqual(gameReducer(spinning, { type: 'cancel' }), {
    version: 3,
    phase: 'intro',
    stepId: 'nature',
    results: {},
  });
  const human = parseSavedGame(
    JSON.stringify({
      version: 3,
      phase: 'complete',
      stepId: 'barrier-knowledge',
      results: {
        nature: 'human',
        lineage: 'gojo',
        'birth-condition': 'none',
        strength: 'megumi',
        speed: 'toji',
        endurance: 'panda',
        'energy-reserve': 'immense',
        'technique-presence': 'yes',
        'innate-technique': 'limitless',
        'energy-control': 'exceptional',
        'energy-output': 'high',
        'technique-proficiency': 'exceptional',
        recovery: 'no-rct',
        'anti-domain': 'none',
        equipment: 'none',
        'barrier-knowledge': 'advanced',
      },
    }),
  );
  assert.equal(human.phase, 'complete');
  for (const stepId of [
    'technique-presence',
    'innate-technique',
    'energy-control',
    'energy-output',
    'technique-proficiency',
    'recovery',
    'anti-domain',
    'equipment',
    'barrier-knowledge',
  ])
    assert.strictEqual(gameReducer(human, { type: 'retry', stepId, testMode: true }), human);
  const withDomain = parseSavedGame(
    JSON.stringify({
      ...human,
      stepId: 'domain-expansion',
      results: {
        ...human.results,
        lineage: 'zenin',
        'innate-technique': 'ten-shadows',
        'domain-expansion': 'chimera-shadow-garden',
      },
    }),
  );
  assert.equal(withDomain.phase, 'complete');
  assert.equal(withDomain.results['domain-expansion'], 'chimera-shadow-garden');
  for (const stepId of ['barrier-knowledge', 'domain-expansion'])
    assert.strictEqual(
      gameReducer(withDomain, { type: 'retry', stepId, testMode: true }),
      withDomain,
    );
});
