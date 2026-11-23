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
    stepId: 'energy-reserve',
    results: {
      nature: 'simurian',
      strength: 'megumi',
      speed: 'toji',
      endurance: 'hanami',
      'energy-reserve': 'immense',
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
  const human = parseSavedGame(
    JSON.stringify({
      version: 3,
      phase: 'complete',
      stepId: 'technique-proficiency',
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
  ])
    assert.strictEqual(gameReducer(human, { type: 'retry', stepId, testMode: true }), human);
});
