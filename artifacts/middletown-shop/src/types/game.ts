export type PrizeType =
  | "wallet"
  | "data"
  | "points"
  | "coupon"
  | "lose";

export interface WheelPrize {
  id: number;
  title: string;
  type: PrizeType;

  // Amount of wallet/data/points etc.
  value: number;

  // Wheel color
  color: string;

  // Probability weight (used later)
  probability: number;

  // Optional icon name
  icon?: string;
}

export interface SpinResult {
  prize: WheelPrize;
  rotation: number;
}