import type { UserProfile } from "@/lib/types";

/**
 * Returns the price an agent should pay for a bundle.
 *
 * Priority:
 * 1. bundle.agentPrice > 0 → use fixed agent price
 * 2. bundle.agentDiscount > 0 → apply discount %
 * 3. otherwise → normal price
 *
 * Non-agents always pay normal price.
 */
export function getBundlePrice(
  bundle: any,
  profile: UserProfile | null | undefined
): number {
  const normalPrice = Number(bundle?.price || 0);

  if (!bundle || profile?.role !== "agent") {
    return normalPrice;
  }

  const agentPrice = Number(bundle?.agentPrice);

  if (!isNaN(agentPrice) && agentPrice > 0) {
    return agentPrice;
  }

  const agentDiscount = Number(bundle?.agentDiscount);

  if (!isNaN(agentDiscount) && agentDiscount > 0) {
    return Math.max(
      0,
      normalPrice * (1 - agentDiscount / 100)
    );
  }

  return normalPrice;
}

/**
 * True when an agent actually gets a lower price.
 */
export function hasAgentPricing(
  bundle: any,
  profile: UserProfile | null | undefined
): boolean {
  if (!bundle || profile?.role !== "agent") {
    return false;
  }

  const normalPrice = Number(bundle?.price || 0);
  const finalPrice = getBundlePrice(bundle, profile);

  return finalPrice < normalPrice;
}

/**
 * Safe Ghana Cedi formatter.
 */
export function formatGHS(value: unknown): string {
  return Number(value || 0).toFixed(2);
}