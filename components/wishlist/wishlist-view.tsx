"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProductDTO } from "@/lib/types";
import { trackEvent } from "@/lib/trackEvent";

type WishlistViewProps = {
  initialItems: ProductDTO[];
};

// Purely cosmetic gamification label based on wishlist size - no real
// ranking/leaderboard system, just a fun nudge ("optional Rang-Label" per spec).
function rankLabel(count: number): string | null {
  if (count >= 12) return "Trend Hunter";
  if (count >= 5) return "Style Scout";
  if (count >= 1) return "Wishlist Starter";
  return null;
}

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function WishlistView({ initialItems }: WishlistViewProps) {
  const [items, setItems] = useState(initialItems);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, p) => sum + p.price, 0);
    const categoryCounts = new Map<string, number>();
    items.forEach((p) => categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1));
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
    return { totalValue, count: items.length, topCategories, rank: rankLabel(items.length) };
  }, [items]);

  async function remove(productId: string) {
    setItems((prev) => prev.filter((p) => p.id !== productId));
    trackEvent(productId, "product_wishlist_remove");
    trackEvent(productId, "product_unlike");
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      // Optimistic UI; a failed sync isn't worth restoring the item for.
    }
  }

  return (
    <div className="no-scrollbar h-dvh overflow-y-auto px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-bold">Deine Wishlist</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">
          Noch nichts gespeichert. Doppeltippe ein Produkt im Feed, um es hier zu sammeln.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Deine Wishlist ist</p>
            <p className="text-2xl font-bold text-accent">{currency.format(stats.totalValue)}</p>
            <p className="text-sm text-zinc-400">
              wert · {stats.count} {stats.count === 1 ? "Produkt" : "Produkte"}
            </p>
            {stats.topCategories.length > 0 && (
              <p className="mt-2 text-xs text-zinc-500">Top-Kategorien: {stats.topCategories.join(", ")}</p>
            )}
            {stats.rank && (
              <span className="mt-3 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                {stats.rank}
              </span>
            )}
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {items.map((product) => (
              <li key={product.id} className="flex gap-3 rounded-2xl bg-zinc-900 p-3">
                <Link href={`/product/${product.id}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.posterUrl ?? product.imageUrl}
                    alt={product.name}
                    className="h-20 w-16 rounded-xl object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <Link href={`/product/${product.id}`} className="block">
                    <p className="text-xs text-zinc-400">{product.shopName}</p>
                    <p className="text-sm font-semibold leading-tight">{product.name}</p>
                    <p className="text-sm font-bold text-accent">{currency.format(product.price)}</p>
                  </Link>
                  <div className="flex gap-3 text-xs">
                    <a
                      href={`/go/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-accent"
                    >
                      Zum Shop
                    </a>
                    <button type="button" onClick={() => remove(product.id)} className="text-zinc-500">
                      Entfernen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
