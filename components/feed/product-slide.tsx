"use client";

import { useRef, useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { ProductMedia } from "@/components/feed/product-media";
import { CommentIcon, HeartIcon, ShareIcon, ShopBagIcon, StarIcon } from "@/components/icons";

type ProductSlideProps = {
  product: ProductDTO;
  isActive: boolean;
  shouldMount: boolean;
  isWishlisted: boolean;
  position: number;
  total: number;
  onDoubleTapWishlist: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
  onShare: (productId: string) => void;
  onComment: (productId: string) => void;
};

const DOUBLE_TAP_WINDOW_MS = 300;

export function ProductSlide({
  product,
  isActive,
  shouldMount,
  isWishlisted,
  position,
  total,
  onDoubleTapWishlist,
  onToggleWishlist,
  onShare,
  onComment,
}: ProductSlideProps) {
  const lastTapRef = useRef(0);
  const [heartPopKey, setHeartPopKey] = useState(0);

  function handleMediaTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      lastTapRef.current = 0;
      setHeartPopKey((k) => k + 1);
      onDoubleTapWishlist(product.id);
    } else {
      lastTapRef.current = now;
    }
  }

  const priceLabel = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(product.price);

  return (
    <section className="relative h-dvh w-full shrink-0 snap-start overflow-hidden" data-product-id={product.id}>
      <ProductMedia product={product} isActive={isActive} shouldMount={shouldMount} />

      {/* Tap target for double-tap-to-wishlist */}
      <div className="absolute inset-0" onClick={handleMediaTap} />

      {heartPopKey > 0 && (
        <div key={heartPopKey} className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <HeartIcon filled className="animate-heart-pop h-28 w-28 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]" />
        </div>
      )}

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-sm">
        <div className="flex items-center gap-2">
          {product.viralScore >= 80 && (
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              🔥 Trending
            </span>
          )}
        </div>
        <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs text-zinc-200 backdrop-blur">
          {position} / {total}
        </span>
      </div>

      {/* Right action bar */}
      <div className="pointer-events-auto absolute right-3 bottom-28 flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Will ich"
        >
          <HeartIcon filled={isWishlisted} className={`h-8 w-8 ${isWishlisted ? "text-accent" : "text-white"}`} />
          <span className="text-xs font-medium">Will ich</span>
        </button>

        <a
          href={`/go/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-white"
        >
          <ShopBagIcon className="h-8 w-8" />
          <span className="text-xs font-medium">Zum Shop</span>
        </a>

        <button
          type="button"
          onClick={() => onComment(product.id)}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Kommentare"
        >
          <CommentIcon className="h-8 w-8" />
          <span className="text-xs font-medium">Kommentare</span>
        </button>

        <button
          type="button"
          onClick={() => onShare(product.id)}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Teilen"
        >
          <ShareIcon className="h-8 w-8" />
          <span className="text-xs font-medium">Teilen</span>
        </button>
      </div>

      {/* Bottom info overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-4 pt-16 pb-28">
        <p className="text-xs font-medium text-zinc-300">{product.shopName}</p>
        <h2 className="mt-0.5 text-lg font-bold leading-tight">{product.name}</h2>
        <p className="mt-1 text-xl font-bold text-accent">{priceLabel}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-300">
          <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
          <span>
            {product.rating.toFixed(1)} ({product.ratingCount.toLocaleString("de-DE")})
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{product.description}</p>
        <p className="mt-2 text-[11px] text-zinc-500">Externer Shop · ggf. Affiliate-Link</p>
      </div>
    </section>
  );
}
