import type { WheelDefinition } from '../data/wheels.ts';
import { getSegments } from './wheel.ts';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const rarityLabels: Record<Rarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export function rarityForProbability(probability: number): Rarity {
  if (!Number.isFinite(probability) || probability <= 0 || probability > 1)
    throw new Error('Expected a probability in (0, 1].');
  return probability >= 0.3
    ? 'common'
    : probability >= 0.15
      ? 'uncommon'
      : probability >= 0.05
        ? 'rare'
        : probability >= 0.02
          ? 'epic'
          : 'legendary';
}

// Supply the same filtered wheel used by pickOption and the SVG. Never use a raw weight.
export function resultChance(wheel: WheelDefinition, resultId: string, automatic = false) {
  if (automatic || wheel.options.length <= 1) return undefined;
  const segment = getSegments(wheel.options).find(({ option }) => option.id === resultId);
  return segment
    ? { probability: segment.probability, rarity: rarityForProbability(segment.probability) }
    : undefined;
}

export function formatChance(probability: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(
    probability,
  );
}
