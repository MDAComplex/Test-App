"use client";

import { useEffect, useRef } from "react";
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
  const isVideo = product.mediaType === "video" && Boolean(product.videoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = video.currentTime || 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  if (!shouldMount) {
    return <div className="absolute inset-0 bg-black" />;
  }

  if (product.mediaFit === "cover") {
    return (
      <div className="absolute inset-0 bg-black">
        {isVideo ? (
          <video
            ref={videoRef}
            src={product.videoUrl!}
            poster={product.posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
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
          <video
            ref={videoRef}
            src={product.videoUrl!}
            poster={product.posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="absolute inset-0 h-full w-full object-contain" />
        )}
      </div>
    );
  }

  // contain / auto
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      {isVideo ? (
        <video
          ref={videoRef}
          src={product.videoUrl!}
          poster={product.posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
      )}
    </div>
  );
}
