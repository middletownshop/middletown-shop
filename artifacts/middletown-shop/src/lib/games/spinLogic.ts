import { WHEEL_PRIZES } from "./prizes";
import { WheelPrize } from "@/types/game";

const SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / SEGMENTS;

/**
 * Select a prize using weighted probability.
 */
export function pickPrize(): WheelPrize {
  const totalWeight = WHEEL_PRIZES.reduce(
    (sum, prize) => sum + prize.probability,
    0
  );

  const random = Math.random() * totalWeight;

  let cumulative = 0;

  for (const prize of WHEEL_PRIZES) {
    cumulative += prize.probability;

    if (random <= cumulative) {
      return prize;
    }
  }

  return WHEEL_PRIZES[0];
}

/**
 * Calculate how much the wheel should rotate
 * so the selected prize lands under the fixed pointer.
 */
export function calculateRotation(prizeId: number): number {
  const segmentCenter = prizeId * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

  const fullSpins = 5;

  return (
    fullSpins * 360 +
    (360 - segmentCenter)
  );
}

/**
 * Returns true if 24 hours have passed.
 */
export function canSpin(lastSpin?: Date | null): boolean {
  if (!lastSpin) return true;

  const hours =
    (Date.now() - lastSpin.getTime()) /
    (1000 * 60 * 60);

  return hours >= 24;
}

/**
 * Remaining cooldown in milliseconds.
 */
export function getRemainingTime(
  lastSpin?: Date | null
): number {
  if (!lastSpin) return 0;

  const end =
    lastSpin.getTime() +
    24 * 60 * 60 * 1000;

  return Math.max(0, end - Date.now());
}