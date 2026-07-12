import { WHEEL_PRIZES } from "./prizes";
import { WheelPrize } from "@/types/game";

const SEGMENT_ANGLE = 360 / WHEEL_PRIZES.length;

export function pickPrize(): WheelPrize {
  const total = WHEEL_PRIZES.reduce(
    (sum, prize) => sum + prize.probability,
    0
  );

  let random = Math.random() * total;

  for (const prize of WHEEL_PRIZES) {
    random -= prize.probability;

    if (random <= 0) {
      return prize;
    }
  }

  return WHEEL_PRIZES[0];
}

/**
 * Calculate how much the wheel should rotate
 * so the selected prize lands under the fixed pointer.
 */

export function calculateRotation(
  prize: WheelPrize,
  currentRotation: number
): number {
  const index = WHEEL_PRIZES.findIndex(p => p.id === prize.id);

  // 1. Get the current wheel's placement normalized within 0 to 360 degrees
  const currentNormalizedAngle = currentRotation % 360;

  // 2. Calculate target visual center. 
  // Because your SVG slices use "- 90", index 0's visual center is already pointing 
  // straight up at 12 o'clock if rotation = 0.
  // To rotate index N to the top pointer clockwise, we invert the path:
  const targetAngle = (360 - (index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)) % 360;

  // 3. Find the exact visual distance needed to turn from the current position to the target position
  let distance = targetAngle - currentNormalizedAngle;

  // Ensure the wheel always rotates forward (clockwise)
  if (distance <= 0) {
    distance += 360;
  }

  // 4. Add the structural full visual spins for excitement (e.g., 5 to 7 full rounds)
  const extraSpins = 5 + Math.floor(Math.random() * 3);
  const totalExtraSpinsDegrees = extraSpins * 360;

  // 5. Return the true additive rotation target
  return currentRotation + totalExtraSpinsDegrees + distance;
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