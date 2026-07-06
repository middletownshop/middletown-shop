import { WheelPrize } from "@/types/game";

export const WHEEL_PRIZES: WheelPrize[] = [
  {
    id: 0,
    title: "₵2 Wallet",
    type: "wallet",
    value: 2,
    color: "#16a34a",
    probability: 20,
  },

  {
    id: 1,
    title: "100MB Data",
    type: "data",
    value: 100,
    color: "#2563eb",
    probability: 18,
  },

  {
    id: 2,
    title: "500 Points",
    type: "points",
    value: 500,
    color: "#9333ea",
    probability: 18,
  },

  {
    id: 3,
    title: "10% Coupon",
    type: "coupon",
    value: 10,
    color: "#ea580c",
    probability: 10,
  },

  {
    id: 4,
    title: "Try Again",
    type: "lose",
    value: 0,
    color: "#6b7280",
    probability: 12,
  },

  {
    id: 5,
    title: "₵5 Wallet",
    type: "wallet",
    value: 5,
    color: "#15803d",
    probability: 8,
  },

  {
    id: 6,
    title: "250MB Data",
    type: "data",
    value: 250,
    color: "#0891b2",
    probability: 8,
  },

  {
    id: 7,
    title: "1GB Data",
    type: "data",
    value: 1024,
    color: "#dc2626",
    probability: 6,
  },
];