import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/products";
import type { ProductDTO } from "@/lib/types";

export const FEED_BATCH_SIZE = 15;

type GetFeedBatchOptions = {
  userId?: string | null;
  excludeIds: string[];
  limit?: number;
};

// Phase 3 placeholder ranking: viralScore plus a random jitter, with
// already-seen products pushed to the end (and only recycled once the
// unseen pool runs out). Phase 7 swaps the scoring step for the full
// FeedScore formula (categoryMatch + tagMatch + viralScore +
// globalEngagementScore + noveltyBonus + randomExploration -
// alreadySeenPenalty) without changing this function's signature.
export async function getFeedBatch({
  userId,
  excludeIds,
  limit = FEED_BATCH_SIZE,
}: GetFeedBatchOptions): Promise<ProductDTO[]> {
  const [products, wishlistRows] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true } }),
    userId
      ? prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } })
      : Promise.resolve([] as { productId: string }[]),
  ]);

  const wishlistedIds = new Set(wishlistRows.map((row) => row.productId));
  const excludeSet = new Set(excludeIds);

  const score = (viralScore: number) => viralScore + Math.random() * 30;

  const unseen = products
    .filter((p) => !excludeSet.has(p.id))
    .map((product) => ({ product, score: score(product.viralScore) }))
    .sort((a, b) => b.score - a.score);

  const seen = products
    .filter((p) => excludeSet.has(p.id))
    .map((product) => ({ product, score: score(product.viralScore) }))
    .sort((a, b) => b.score - a.score);

  const ranked = [...unseen, ...seen].slice(0, limit);

  return ranked.map(({ product }) => toProductDTO(product, wishlistedIds.has(product.id)));
}
