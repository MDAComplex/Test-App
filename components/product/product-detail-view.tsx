"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductDTO, OfferDTO } from "@/lib/types";
import type { CommentDTO } from "@/app/api/comments/route";
import { ProductMedia } from "@/components/feed/product-media";
import { CommentsSection } from "@/components/product/comments-section";
import { MiniProductRow, type MiniProduct } from "@/components/product/mini-product-row";
import { HeartIcon, ShareIcon, StarIcon } from "@/components/icons";
import { trackEvent } from "@/lib/trackEvent";

type ProductDetailViewProps = {
  product: ProductDTO;
  offers: OfferDTO[];
  initialComments: CommentDTO[];
  relatedProducts: MiniProduct[];
  isLoggedIn: boolean;
};

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function ProductDetailView({
  product,
  offers,
  initialComments,
  relatedProducts,
  isLoggedIn,
}: ProductDetailViewProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted);
  const [busy, setBusy] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const primaryOffer = offers.find((o) => o.isPrimary) ?? offers[0] ?? null;
  const otherOffers = offers.filter((o) => o !== primaryOffer);

  async function toggleWishlist() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !isWishlisted;
    setIsWishlisted(next);
    trackEvent(product.id, next ? "product_wishlist_add" : "product_wishlist_remove");
    try {
      await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
    } catch {
      setIsWishlisted(!next);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    trackEvent(product.id, "product_share");
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: product.name });
        return;
      } catch {
        // User cancelled or share failed; fall through to clipboard fallback.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // Nothing more we can do without a sharing API; not worth blocking the UI for.
    }
  }

  function shopHref(offerId?: string) {
    return offerId ? `/go/${product.id}?offerId=${offerId}` : `/go/${product.id}`;
  }

  return (
    <div className="no-scrollbar h-dvh overflow-y-auto pb-16">
      {/* Header / back */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-black/70 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white"
          aria-label="Zurück"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white"
            aria-label="Teilen"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleWishlist}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800"
            aria-label="Will ich"
          >
            <HeartIcon filled={isWishlisted} className={`h-5 w-5 ${isWishlisted ? "text-accent" : "text-white"}`} />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-[3/4] w-full">
        <ProductMedia product={product} isActive shouldMount />
      </div>

      <div className="px-4 pt-4">
        <p className="text-xs font-medium text-zinc-400">{product.shopName}</p>
        <h1 className="mt-0.5 text-xl font-bold leading-tight">{product.name}</h1>
        <p className="mt-1.5 text-2xl font-bold text-accent">{currency.format(product.price)}</p>
        {product.deliveryTime && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
            🚚 {product.deliveryTime}
          </span>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-300">
          <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
          <span>
            {product.rating.toFixed(1)} ({product.ratingCount.toLocaleString("de-DE")})
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{product.description}</p>

        {/* Offers */}
        {offers.length > 0 ? (
          <div className="mt-6">
            {primaryOffer && (
              <div className="rounded-2xl border border-[#7C3AED]/40 bg-zinc-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">{primaryOffer.shopName}</p>
                    <p className="text-lg font-bold text-accent">{currency.format(primaryOffer.price)}</p>
                    {primaryOffer.deliveryText && (
                      <p className="mt-0.5 text-xs text-zinc-500">{primaryOffer.deliveryText}</p>
                    )}
                  </div>
                  <a
                    href={shopHref(primaryOffer.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Zum Shop
                  </a>
                </div>
              </div>
            )}

            {otherOffers.length > 0 && (
              <>
                <h2 className="mt-5 text-sm font-bold">Weitere Angebote</h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {otherOffers.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-900 p-3"
                    >
                      <div>
                        <p className="text-xs text-zinc-400">{o.shopName}</p>
                        <p className="text-sm font-bold text-accent">{currency.format(o.price)}</p>
                        {o.deliveryText && <p className="text-xs text-zinc-500">{o.deliveryText}</p>}
                      </div>
                      <a
                        href={shopHref(o.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-white"
                      >
                        Zum Shop
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <a
            href={shopHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full rounded-xl bg-[#7C3AED] py-3 text-center font-semibold text-white"
          >
            Zum Shop
          </a>
        )}

        <p className="mt-3 text-[11px] text-zinc-500">Externer Shop · ggf. Affiliate-Link</p>

        <CommentsSection
          productId={product.id}
          initialComments={initialComments}
          isLoggedIn={isLoggedIn}
        />

        <MiniProductRow title="Das könnte dir auch gefallen" products={relatedProducts} />
      </div>

      {showToast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center">
          <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-white/10">
            Link kopiert!
          </span>
        </div>
      )}
    </div>
  );
}
