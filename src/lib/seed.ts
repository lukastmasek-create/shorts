import { random } from "remotion";

/**
 * Deterministic PRNG utilities backed exclusively by Remotion's random(seed).
 * Never uses Math.random() or Date.now().
 */
export function seededUnit(seed: string | number): number {
  return random(seed);
}

export function seededFloat(seed: string | number, min: number, max: number): number {
  return min + random(seed) * (max - min);
}

export function seededSigned(seed: string | number, amplitude = 1): number {
  return (random(seed) * 2 - 1) * amplitude;
}

export function seededInt(seed: string | number, minInclusive: number, maxInclusive: number): number {
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(random(seed) * span);
}

export function seededPick<T>(seed: string | number, items: readonly T[]): T {
  const idx = Math.min(items.length - 1, Math.floor(random(seed) * items.length));
  return items[idx];
}

export function seededTuple3(
  seedPrefix: string,
  ranges: readonly [[number, number], [number, number], [number, number]]
): [number, number, number] {
  return [
    seededFloat(`${seedPrefix}:x`, ranges[0][0], ranges[0][1]),
    seededFloat(`${seedPrefix}:y`, ranges[1][0], ranges[1][1]),
    seededFloat(`${seedPrefix}:z`, ranges[2][0], ranges[2][1]),
  ];
}
