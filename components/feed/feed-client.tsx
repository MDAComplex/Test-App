"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { ProductDTO } from "@/lib/types";
import { ProductSlide } from "@/components/feed/product-slide";
import { trackEvent } from "@/lib/trackEvent";

type FeedClientProps = {
  initialItems: ProductDTO[];
  totalCount: number;
};

const PREFETCH_THRESHOLD = 5;
const VISIBLE_2S_MS = 2000;
const VISIBLE_5S_MS = 5000;

export function FeedClient({ initialItems, totalCount }: FeedClientProps) {
  const { status } = useSession();
  const [items, setItems] = useState(initialItems);
  const [wishlisted, setWishlisted] = useState<Set<string>>(
    () => new Set(initialItems.filter((p) => p.isWishlisted).map((p) => p.id)),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [authPrompt, setAuthPrompt] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<string, HTMLElement>>(new Map());
  const loadingMoreRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set(initialItems.map((p) => p.id)));
  const viewedRef = useRef<Set<string>>(new Set());
  const visibleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const activeIndexRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const exclude = Array.from(seenIdsRef.current).join(",");
      const res = await fetch(`/api/feed?exclude=${encodeURIComponent(exclude)}`);
      if (!res.ok) return;
      const data = await res.json();
      const next: ProductDTO[] = data.items ?? [];
      next.forEach((p) => seenIdsRef.current.add(p.id));
      setItems((prev) => [...prev, ...next]);
    } catch {
      // Infinite scroll failing silently is fine; the user can keep
      // scrolling within what's already loaded.
    } finally {
      loadingMoreRef.current = false;
    }
  }, []);

  // Tracks which slide is active, fires product_view / scroll direction
  // events, and schedules the 2s/5s "still visible" events.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6);
        if (!visible) return;
        const target = visible.target as HTMLElement;
        const id = target.dataset.productId;
        const index = Number(target.dataset.index);
        if (Number.isNaN(index) || !id) return;

        if (index !== activeIndexRef.current) {
          trackEvent(id, index > activeIndexRef.current ? "product_scroll_next" : "product_scroll_previous");
          activeIndexRef.current = index;
          setActiveIndex(index);
        }

        if (!viewedRef.current.has(`${id}-${index}`)) {
          viewedRef.current.add(`${id}-${index}`);
          trackEvent(id, "product_view");
        }

        visibleTimersRef.current.forEach(clearTimeout);
        visibleTimersRef.current = [
          setTimeout(() => trackEvent(id, "product_visible_2s"), VISIBLE_2S_MS),
          setTimeout(() => trackEvent(id, "product_visible_5s"), VISIBLE_5S_MS),
        ];

        if (index >= items.length - PREFETCH_THRESHOLD) {
          loadMore();
        }
      },
      { threshold: [0, 0.6] },
    );

    slideRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, loadMore]);

  function setWishlistState(productId: string, value: boolean) {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (value) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  async function addToWishlist(productId: string) {
    if (status !== "authenticated") {
      setAuthPrompt(true);
      return;
    }
    setWishlistState(productId, true);
    trackEvent(productId, "product_wishlist_add");
    trackEvent(productId, "product_like");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        setWishlistState(productId, false);
        setAuthPrompt(true);
      }
    } catch {
      // Keep the optimistic UI state; a failed sync isn't worth disrupting the feed for.
    }
  }

  async function removeFromWishlist(productId: string) {
    setWishlistState(productId, false);
    trackEvent(productId, "product_wishlist_remove");
    trackEvent(productId, "product_unlike");
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      // Same as above: optimistic UI wins over a perfectly synced backend.
    }
  }

  function handleToggleWishlist(productId: string) {
    if (wishlisted.has(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  }

  function handleDoubleTapWishlist(productId: string) {
    if (!wishlisted.has(productId)) {
      addToWishlist(productId);
    }
  }

  async function handleShare(productId: string) {
    trackEvent(productId, "product_share");
    const url = `${window.location.origin}/go/${productId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "Wishlist Wars" });
        return;
      } catch {
        // User cancelled or share failed; fall through to clipboard fallback.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Nothing more we can do without a sharing API; not worth blocking the UI for.
    }
  }

  return (
    <div className="relative h-dvh w-full">
      <div ref={containerRef} className="no-scrollbar h-dvh w-full snap-y snap-mandatory overflow-y-scroll">
        {items.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            ref={(el) => {
              if (el) slideRefs.current.set(`${product.id}-${index}`, el);
              else slideRefs.current.delete(`${product.id}-${index}`);
            }}
            data-product-id={product.id}
            data-index={index}
          >
            <ProductSlide
              product={product}
              isActive={index === activeIndex}
              shouldMount={Math.abs(index - activeIndex) <= 1}
              isWishlisted={wishlisted.has(product.id)}
              position={index + 1}
              total={Math.max(totalCount, items.length)}
              onDoubleTapWishlist={handleDoubleTapWishlist}
              onToggleWishlist={handleToggleWishlist}
              onShare={handleShare}
            />
          </div>
        ))}
      </div>

      {authPrompt && (
        <div className="absolute inset-x-4 bottom-24 z-40 rounded-2xl bg-zinc-900/95 p-4 text-sm shadow-lg ring-1 ring-white/10">
          <p className="text-white">Erstelle einen kostenlosen Account, um deine Wishlist zu speichern.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/register" className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white">
              Account erstellen
            </Link>
            <button
              type="button"
              onClick={() => setAuthPrompt(false)}
              className="rounded-lg px-3 py-1.5 text-zinc-400"
            >
              Spaeter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
