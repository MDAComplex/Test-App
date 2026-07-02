import { prisma } from "@/lib/prisma";
import { parseTags, toProductDTO } from "@/lib/products";
import type { ProductDTO } from "@/lib/types";

export const FEED_BATCH_SIZE = 15;

export type ProductCountMaps = {
  likeCountMap: Map<string, number>;
  viewCountMap: Map<string, number>;
  commentCountMap: Map<string, number>;
};

// Shared social-proof count loader for a known set of products. Mirrors the
// groupBy pattern used inside getFeedBatch, but scoped to specific productIds
// so pages like /discover, related products and "recently viewed" can reuse it
// without pulling counts for the whole catalog.
export async function getProductCounts(productIds: string[]): Promise<ProductCountMaps> {
  const empty: ProductCountMaps = {
    likeCountMap: new Map(),
    viewCountMap: new Map(),
    commentCountMap: new Map(),
  };
  if (productIds.length === 0) return empty;

  const [likeCounts, viewCounts, commentCounts] = await Promise.all([
    prisma.userProductEvent.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, eventType: { in: ["product_like", "product_wishlist_add"] } },
      _count: { _all: true },
    }),
    prisma.userProductEvent.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, eventType: "product_view" },
      _count: { _all: true },
    }),
    prisma.productComment.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, isDeleted: false },
      _count: { _all: true },
    }),
  ]);

  const toCountMap = (rows: { productId: string; _count: { _all: number } }[]) =>
    new Map(rows.map((row) => [row.productId, row._count._all]));

  return {
    likeCountMap: toCountMap(likeCounts),
    viewCountMap: toCountMap(viewCounts),
    commentCountMap: toCountMap(commentCounts),
  };
}

type GetFeedBatchOptions = {
  userId?: string | null;
  excludeIds: string[];
  limit?: number;
};

const NOVELTY_WINDOW_DAYS = 14;
const NOVELTY_MAX_BONUS = 20;
const RANDOM_EXPLORATION_MAX = 15;
const ALREADY_SEEN_PENALTY = 35;
const ENGAGEMENT_SCORE_CAP = 40;

// FeedScore = categoryMatch + tagMatch + viralScore + globalEngagementScore
//           + noveltyBonus + randomExploration - alreadySeenPenalty
//
// Deliberately simple/additive heuristics, no ML - every term below can be
// tuned or swapped independently:
// - categoryMatch / tagMatch: how much this user has previously engaged
//   with this product's category/tags (lib/preferences.ts, updated on every
//   wishlist add/remove). 0 for anonymous/new users, so the feed still
//   works without history.
// - viralScore: editorial "this tends to perform well" signal set by admins.
// - globalEngagementScore: how much ALL users like/wishlist/click this
//   product (see getGlobalEngagementScores), log-scaled + capped so a
//   handful of viral outliers can't drown out everything else.
// - noveltyBonus: linearly decays to 0 over NOVELTY_WINDOW_DAYS, so newly
//   added products get a temporary visibility boost while they build up
//   their own engagement numbers.
// - randomExploration: small jitter so the feed isn't 100% deterministic.
// - alreadySeenPenalty: pushes products already shown this session down
//   rather than hard-excluding them - with a small catalog, a fixed
//   penalty (not a hard filter) lets the feed recycle once everything
//   unseen has been shown, instead of running out of content.
export async function getFeedBatch({
  userId,
  excludeIds,
  limit = FEED_BATCH_SIZE,
}: GetFeedBatchOptions): Promise<ProductDTO[]> {
  const [products, wishlistRows, preference, engagementScores, likeCounts, viewCounts, commentCounts] =
    await Promise.all([
      prisma.product.findMany({ where: { isActive: true } }),
      userId
        ? prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } })
        : Promise.resolve([] as { productId: string }[]),
      userId ? prisma.userPreference.findUnique({ where: { userId } }) : Promise.resolve(null),
      getGlobalEngagementScores(),
      prisma.userProductEvent.groupBy({
        by: ["productId"],
        where: { eventType: { in: ["product_like", "product_wishlist_add"] } },
        _count: { _all: true },
      }),
      prisma.userProductEvent.groupBy({
        by: ["productId"],
        where: { eventType: "product_view" },
        _count: { _all: true },
      }),
      prisma.productComment.groupBy({
        by: ["productId"],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
    ]);

  const wishlistedIds = new Set(wishlistRows.map((row) => row.productId));
  const toCountMap = (rows: { productId: string; _count: { _all: number } }[]) =>
    new Map(rows.map((row) => [row.productId, row._count._all]));
  const likeCountMap = toCountMap(likeCounts);
  const viewCountMap = toCountMap(viewCounts);
  const commentCountMap = toCountMap(commentCounts);
  const excludeSet = new Set(excludeIds);
  const categoryWeights: Record<string, number> = preference ? JSON.parse(preference.categoryWeights) : {};
  const tagWeights: Record<string, number> = preference ? JSON.parse(preference.tagWeights) : {};
  const now = Date.now();

  const scored = products.map((product) => {
    const tags = parseTags(product.tags);
    const categoryMatch = (categoryWeights[product.category] ?? 0) * 4;
    const tagMatch = tags.reduce((sum, tag) => sum + (tagWeights[tag] ?? 0), 0) * 2;
    const ageDays = (now - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const noveltyBonus = Math.max(0, NOVELTY_MAX_BONUS * (1 - ageDays / NOVELTY_WINDOW_DAYS));
    const randomExploration = Math.random() * RANDOM_EXPLORATION_MAX;
    const alreadySeenPenalty = excludeSet.has(product.id) ? ALREADY_SEEN_PENALTY : 0;
    const globalEngagementScore = engagementScores.get(product.id) ?? 0;

    const score =
      categoryMatch +
      tagMatch +
      product.viralScore +
      globalEngagementScore +
      noveltyBonus +
      randomExploration -
      alreadySeenPenalty;

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ product }) =>
    toProductDTO(product, wishlistedIds.has(product.id), {
      likeCount: likeCountMap.get(product.id) ?? 0,
      viewCount: viewCountMap.get(product.id) ?? 0,
      commentCount: commentCountMap.get(product.id) ?? 0,
    }),
  );
}

async function getGlobalEngagementScores(): Promise<Map<string, number>> {
  const [likeGroups, clickGroups] = await Promise.all([
    prisma.userProductEvent.groupBy({
      by: ["productId"],
      where: { eventType: { in: ["product_like", "product_wishlist_add"] } },
      _count: { _all: true },
    }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      _count: { _all: true },
    }),
  ]);

  // Affiliate clicks are weighted higher than likes - they're a stronger
  // "actually wants to buy this" signal than a tap-to-save gesture.
  const weighted = new Map<string, number>();
  for (const group of likeGroups) {
    weighted.set(group.productId, (weighted.get(group.productId) ?? 0) + group._count._all * 2);
  }
  for (const group of clickGroups) {
    weighted.set(group.productId, (weighted.get(group.productId) ?? 0) + group._count._all * 3);
  }

  const scores = new Map<string, number>();
  for (const [productId, value] of weighted) {
    scores.set(productId, Math.min(ENGAGEMENT_SCORE_CAP, Math.log2(value + 1) * 8));
  }
  return scores;
}
