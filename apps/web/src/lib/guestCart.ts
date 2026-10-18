"use client";

export interface GuestCartLine {
  cartLineId: string;
  menuItemId: string;
  name: string;
  basePricePaise: number;
  packagingFeePaise: number;
  dietaryTag: string;
  spiceLevel: string;
  quantity: number;
  variantName?: string;
  variantPriceDeltaPaise: number;
  selectedAddons: Array<{ name: string; pricePaise: number }>;
  notes?: string;
}

export interface GuestCartState {
  restaurantSlug: string;
  tableQrToken?: string;
  appendToOrderToken?: string;
  lines: GuestCartLine[];
}

const STORAGE_PREFIX = "dinepilot_guest_cart_v1_";

export function loadGuestCart(restaurantSlug: string): GuestCartState {
  if (typeof window === "undefined") {
    return { restaurantSlug, lines: [] };
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${restaurantSlug}`);
    if (!raw) return { restaurantSlug, lines: [] };
    const parsed = JSON.parse(raw);
    return {
      restaurantSlug,
      tableQrToken: parsed.tableQrToken,
      appendToOrderToken: parsed.appendToOrderToken,
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  } catch {
    return { restaurantSlug, lines: [] };
  }
}

export function saveGuestCart(state: GuestCartState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${state.restaurantSlug}`,
      JSON.stringify(state)
    );
    window.dispatchEvent(new Event("dinepilot-cart-updated"));
  } catch {
  }
}

export function clearGuestCart(restaurantSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${restaurantSlug}`);
    window.dispatchEvent(new Event("dinepilot-cart-updated"));
  } catch {
  }
}
