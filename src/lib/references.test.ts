import test from 'node:test';
import assert from 'node:assert/strict';
import { getOption, wheels } from '../data/wheels.ts';
import { parseSavedGame } from './game.ts';

test('every physical result has a version, practical explanation, contextual feats and official sources', () => {
  const physicalWheels = wheels.filter((wheel) => wheel.chapterId === 'physical');
  for (const wheel of physicalWheels) {
    for (const option of wheel.options) {
      const reference = option.reference;
      assert.ok(reference, `${wheel.id}/${option.id} is missing its reference`);
      assert.ok(option.description.trim());
      assert.ok(reference.version.trim());
      assert.ok(reference.limitations.trim());
      assert.ok(reference.feats.length >= 1 && reference.feats.length <= 2);
      for (const feat of reference.feats) {
        assert.ok(feat.description.trim());
        assert.ok(feat.context.trim());
        const url = new URL(feat.source.url);
        assert.equal(url.protocol, 'https:');
        assert.equal(url.hostname, 'jujutsukaisen.jp');
        const episode = Number(url.pathname.match(/^\/episodes\/(\d+)\.php$/)?.[1]);
        assert.ok(Number.isInteger(episode) && episode > 0);
        assert.ok(feat.source.label.endsWith(String(episode)));
      }
    }
  }
});

test('physical references consistently use Goodwill versions and reanimated Shibuya Toji', () => {
  for (const wheel of wheels.filter((wheel) => wheel.chapterId === 'physical')) {
    for (const option of wheel.options) {
      assert.match(
        option.reference!.version,
        option.id === 'toji' ? /Shibuya.*reanimado/ : /Intercâmbio/,
      );
      const episodes = option.reference!.feats.map((feat) =>
        Number(new URL(feat.source.url).pathname.match(/(\d+)\.php$/)![1]),
      );
      assert.ok(
        episodes.every((episode) =>
          option.id === 'toji' ? episode >= 39 && episode <= 40 : episode >= 15 && episode <= 20,
        ),
      );
    }
  }
});

test('existing completed saves keep their IDs and expose the new reference details without rerolling', () => {
  const saved = {
    version: 2,
    phase: 'complete',
    stepId: 'endurance',
    results: {
      nature: 'human',
      lineage: 'gojo',
      strength: 'megumi',
      speed: 'maki-goodwill',
      endurance: 'hanami',
    },
  };
  const restored = parseSavedGame(JSON.stringify(saved));
  assert.deepEqual(restored, saved);
  for (const step of ['strength', 'speed', 'endurance']) {
    assert.ok(getOption(step, restored.results[step])?.reference?.feats.length);
  }
});
