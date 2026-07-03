"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductDTO } from "@/lib/types";

type ProductMediaProps = {
  product: ProductDTO;
  isActive: boolean;
  shouldMount: boolean;
};

// mediaFit handling:
// - cover: media fills the screen edge-to-edge (object-cover), cropped.
// - hybrid: blurred/darkened enlarged copy as backdrop + sharp centered copy
//   on top (object-contain), so nothing gets cropped but there's no dead
//   black bars either.
// - contain / auto: plain centered media on black, letterboxed. "auto" has
//   no direct object-fit equivalent, so it's treated like "contain".
export function ProductMedia({ product, isActive, shouldMount }: ProductMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Feed slides are keyed by product id + index, so each product gets a fresh
  // ProductMedia instance and this flag starts clean per product (no manual
  // reset needed when the feed recycles).
  const [videoFailed, setVideoFailed] = useState(false);

  // Fall back to the image whenever there's no usable video source OR the
  // video errored out while loading/playing.
  const isVideo = product.mediaType === "video" && Boolean(product.videoUrl) && !videoFailed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Guarantee muted so browsers don't block autoplay (the `muted` attribute
    // alone is unreliable in React).
    video.muted = true;
    if (isActive) {
      video.currentTime = video.currentTime || 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    // Re-run when the video first mounts (shouldMount) as well as on activation,
    // so a slide that scrolls into view autoplays reliably.
  }, [isActive, shouldMount, isVideo]);

  if (!shouldMount) {
    return <div className="absolute inset-0 bg-black" />;
  }

  const videoProps = {
    ref: videoRef,
    src: product.videoUrl ?? undefined,
    poster: product.posterUrl ?? undefined,
    muted: true,
    loop: true,
    playsInline: true,
    preload: "metadata" as const,
    onError: () => setVideoFailed(true),
  };

  if (product.mediaFit === "cover") {
    return (
      <div className="absolute inset-0 bg-black">
        {isVideo ? (
          <video {...videoProps} className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl || product.posterUrl || ""}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    );
  }

  if (product.mediaFit === "hybrid") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.posterUrl ?? product.imageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-50"
        />
        {isVideo ? (
          <video {...videoProps} className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl || product.posterUrl || ""}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>
    );
  }

  // contain / auto
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      {isVideo ? (
        <video {...videoProps} className="h-full w-full object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl || product.posterUrl || ""}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}
