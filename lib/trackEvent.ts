import type { EventType } from "@/lib/types";

// Fire-and-forget: never await this in UI code, and it never throws, so a
// tracking failure (or an ad-blocker, slow network, etc.) can never block or
// break the feed.
export function trackEvent(productId: string, eventType: EventType, metadata?: Record<string, unknown>) {
  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType, metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
