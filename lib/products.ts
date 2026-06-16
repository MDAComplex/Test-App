import type { Product } from "@/generated/prisma/client";
import type { ProductDTO } from "@/lib/types";

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function serializeTags(tags: string[]): string {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(",");
}

// Stable 0..1 hash so the cosmetic rating doesn't change between requests.
function hashToUnit(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function deriveRating(product: Pick<Product, "id" | "viralScore">) {
  const unit = hashToUnit(product.id);
  const rating = Math.min(5, 3.5 + (product.viralScore / 100) * 1.3 + unit * 0.2);
  const ratingCount = Math.round(40 + product.viralScore * 35 + unit * 600);
  return { rating: Math.round(rating * 10) / 10, ratingCount };
}

export function toProductDTO(product: Product, isWishlisted: boolean): ProductDTO {
  const { rating, ratingCount } = deriveRating(product);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    imageUrl: product.imageUrl,
    videoUrl: product.videoUrl,
    posterUrl: product.posterUrl,
    mediaType: product.mediaType,
    mediaFit: product.mediaFit,
    shopName: product.shopName,
    tags: parseTags(product.tags),
    viralScore: product.viralScore,
    isActive: product.isActive,
    isWishlisted,
    rating,
    ratingCount,
  };
}
