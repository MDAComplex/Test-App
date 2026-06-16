import type { EventType } from "@/lib/types";

export const EVENT_TYPES: readonly EventType[] = [
  "product_view",
  "product_visible_2s",
  "product_visible_5s",
  "product_like",
  "product_unlike",
  "product_wishlist_add",
  "product_wishlist_remove",
  "product_affiliate_click",
  "product_share",
  "product_scroll_next",
  "product_scroll_previous",
];

const EVENT_TYPE_SET = new Set<string>(EVENT_TYPES);

export function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && EVENT_TYPE_SET.has(value);
}
