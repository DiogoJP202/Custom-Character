import test from 'node:test';
import assert from 'node:assert/strict';
import { wheels } from '../data/wheels.ts';
import { getSegments, landingRotation, pickOption } from './wheel.ts';

test('nature angles and probabilities exactly represent configured weights', () => {
  const segments = getSegments(wheels[0].options);
  assert.deepEqual(
    segments.map(({ probability }) => probability),
    [0.45, 0.3, 0.17, 0.08],
  );
  const expected = [
    [0, 162],
    [162, 270],
    [270, 331.2],
    [331.2, 360],
  ];
  segments.forEach(({ start, end }, index) => {
    assert.ok(Math.abs(start - expected[index][0]) < 1e-9);
    assert.ok(Math.abs(end - expected[index][1]) < 1e-9);
  });
});

test('every wheel selects each interval including its lower and upper boundaries', () => {
  for (const wheel of wheels) {
    for (const segment of getSegments(wheel.options)) {
      assert.equal(pickOption(wheel.options, () => segment.middle / 360).id, segment.option.id);
      assert.equal(
        pickOption(wheel.options, () => (segment.start + 0.000001) / 360).id,
        segment.option.id,
      );
      assert.equal(
        pickOption(wheel.options, () => (segment.end - 0.000001) / 360).id,
        segment.option.id,
      );
    }
    assert.equal(pickOption(wheel.options, () => 0).id, wheel.options[0].id);
    assert.equal(pickOption(wheel.options, () => 1 - Number.EPSILON).id, wheel.options.at(-1)!.id);
  }
  assert.equal(pickOption(wheels[0].options, () => 0.45).id, 'cursed-spirit');
  assert.equal(pickOption(wheels[0].options, () => 0.75).id, 'independent-cursed-corpse');
  assert.equal(pickOption(wheels[0].options, () => 0.92).id, 'simurian');
});

test('a stratified sample gives exactly the configured percentages without flaky sampling', () => {
  for (const wheel of wheels) {
    const counts: Record<string, number> = {};
    for (let index = 0; index < 10000; index++) {
      const result = pickOption(wheel.options, () => (index + 0.5) / 10000);
      counts[result.id] = (counts[result.id] ?? 0) + 1;
    }
    for (const option of wheel.options) assert.equal(counts[option.id], option.weight * 100);
  }
});

test('rotation lands the selected center under the fixed top pointer after full turns', () => {
  for (const wheel of wheels) {
    for (const segment of getSegments(wheel.options)) {
      for (const previous of [0, 37, 2014, -15]) {
        const rotation = landingRotation(segment, previous);
        assert.ok(rotation - previous >= 6 * 360);
        const pointerAngle = (((segment.middle + rotation) % 360) + 360) % 360;
        assert.ok(pointerAngle < 0.000001 || 360 - pointerAngle < 0.000001);
      }
    }
  }
});

test('non-percent totals normalize and invalid inputs fail explicitly', () => {
  const options = wheels[0].options.slice(0, 2).map((option) => ({ ...option, weight: 1 }));
  assert.deepEqual(
    getSegments(options).map(({ probability }) => probability),
    [0.5, 0.5],
  );
  assert.throws(() => getSegments([]));
  assert.throws(() => getSegments([{ ...options[0], weight: 0 }]));
  assert.throws(() => getSegments([{ ...options[0], weight: Infinity }]));
  for (const invalid of [-1, 1, NaN, Infinity])
    assert.throws(() => pickOption(options, () => invalid));
});
