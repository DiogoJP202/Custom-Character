import type { WheelOption } from '../data/wheels.ts';

export const SMALL_SEGMENT_THRESHOLD = 0.1;

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

// Integral of a brief acceleration followed by a long deceleration. The same angle
// drives the SVG and the segment ticks; there is no second animation or random draw.
export function spinProgress(time: number) {
  const t = Math.max(0, Math.min(1, time));
  // Cumulative beta(2, 5): monotone, zero velocity at both ends, exact endpoints.
  return 1 - (1 - t) ** 5 * (1 + 5 * t);
}

export function crossedSegments(segments: Segment[], from: number, to: number) {
  if (to <= from) return 0;
  // A segment's end crosses the fixed top pointer at rotation (360 - end) + n*360.
  return segments.reduce((count, segment) => {
    const boundary = (360 - segment.end) % 360;
    return count + Math.floor((to - boundary) / 360) - Math.floor((from - boundary) / 360);
  }, 0);
}
