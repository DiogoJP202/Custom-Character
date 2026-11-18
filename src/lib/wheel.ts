import type { WheelOption } from '../data/wheels.ts';

export interface Segment {
  option: WheelOption;
  start: number;
  end: number;
  middle: number;
  probability: number;
}

export function getSegments(options: WheelOption[]): Segment[] {
  if (!options.length || options.some(({ weight }) => !Number.isFinite(weight) || weight <= 0)) {
    throw new Error('A wheel needs options with positive, finite weights.');
  }
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  if (!Number.isFinite(total)) throw new Error('Invalid total weight.');
  let cursor = 0;
  return options.map((option, index) => {
    const start = cursor;
    cursor = index === options.length - 1 ? 360 : cursor + (option.weight / total) * 360;
    return {
      option,
      start,
      end: cursor,
      middle: (start + cursor) / 2,
      probability: option.weight / total,
    };
  });
}

export function pickOption(
  options: WheelOption[],
  random: () => number = Math.random,
): WheelOption {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error('Random value must be in [0, 1).');
  const segments = getSegments(options);
  return segments.find((segment) => value * 360 < segment.end)!.option;
}

export function landingRotation(segment: Segment, previous = 0, turns = 6): number {
  const target = (360 - segment.middle) % 360;
  const normalized = ((previous % 360) + 360) % 360;
  return previous + turns * 360 + ((target - normalized + 360) % 360);
}
