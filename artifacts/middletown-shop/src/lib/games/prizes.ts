import { WheelPrize } from "@/types/game";

export const WHEEL_PRIZES: WheelPrize[] = [
  {
    id: 0,
    title: "₵0.50\nCASH",
    type: "wallet",
    value: 0.5,
    color: "#22c55e",
    probability: 20,
  },
  {
    id: 1,
    title: "50\nPoints",
    type: "points",
    value: 50,
    color: "#3b82f6",
    probability: 20,
  },
  {
    id: 2,
    title: "₵100\nCASH", // 🔥 Teaser Grand Prize
    type: "wallet",
    value: 100,
    color: "#dc2626", // Eye-catching Crimson Red
    probability: 0,   // 0% real probability
  },
  {
    id: 3,
    title: "Try\nAgain",
    type: "lose",
    value: 0,
    color: "#6b7280",
    probability: 18,
  },
  {
    id: 4,
    title: "5%\nCoupon",
    type: "coupon",
    value: 5,
    color: "#f97316",
    probability: 12,
  },
  {
    id: 5,
    title: "₵1\nCASH",
    type: "wallet",
    value: 1,
    color: "#10b981",
    probability: 10,
  },
  {
    id: 6,
    title: "₵50\nCASH", // 🔥 Teaser Mega Prize
    type: "wallet",
    value: 50,
    color: "#e11d48", // Vibrant Rose Red
    probability: 0,   // 0% real probability
  },
  {
    id: 7,
    title: "100\nPoints",
    type: "points",
    value: 100,
    color: "#8b5cf6",
    probability: 8,
  },
  {
    id: 8,
    title: "Free\nSpin",
    type: "spin",
    value: 1,
    color: "#facc15",
    probability: 7,
  },
  {
    id: 9,
    title: "₵5\nCASH",
    type: "wallet",
    value: 5,
    color: "#16a34a",
    probability: 0.5,
  },
];