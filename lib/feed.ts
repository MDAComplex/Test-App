import { prisma } from "@/lib/prisma";
import { parseTags, toProductDTO } from "@/lib/products";
import { safeJsonParse } from "@/lib/json";
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

// Feed-v2 tuning knobs (see formula block below).
const BUDGET_IN_RANGE_BONUS = 15;
const BUDGET_FAR_OUT_PENALTY = 10;
const BUDGET_FAR_MULTIPLIER = 3; // price > 3x upper bound = "way outside"
const VIBE_BONUS_EACH = 5;
const VIBE_BONUS_CAP = 15;
const DWELL_AFFINITY_FACTOR = 5;
const DWELL_AFFINITY_CAP = 12;
const WISHLISTED_PENALTY = 25;
const PRODUCT_QUERY_CAP = 500;
const RECENT_ENGAGEMENT_DAYS = 7;

// FeedScore = categoryMatch + tagMatch + viralScore + globalEngagementScore
//           + noveltyBonus + randomExploration
//           + budgetBonus + vibeBonus + dwellAffinity
//           - alreadySeenPenalty - wishlistedPenalty
//
// Deliberately simple/additive heuristics, no ML - every term below can be
// tuned or swapped independently. All terms are 0 for anonymous/new users
// (no onboarding, no history), so the feed still works without any signal.
//
// - categoryMatch / tagMatch: how much this user has previously engaged
//   with this product's category/tags (lib/preferences.ts, updated on every
//   wishlist add/remove).
// - viralScore: editorial "this tends to perform well" signal set by admins.
// - globalEngagementScore: how much ALL users like/wishlist/click this
//   product (see getGlobalEngagementScores), log-scaled + capped. Events from
//   the last RECENT_ENGAGEMENT_DAYS are counted twice ("time-decay ×2") so a
//   product that's hot *right now* outranks one that was hot months ago.
// - noveltyBonus: linearly decays to 0 over NOVELTY_WINDOW_DAYS, so newly
//   added products get a temporary visibility boost while they build up
//   their own engagement numbers.
// - randomExploration: small jitter so the feed isn't 100% deterministic.
// - budgetBonus: from onboarding UserPreference.budgetRange. Products whose
//   price sits inside the chosen band get +BUDGET_IN_RANGE_BONUS; products
//   priced above BUDGET_FAR_MULTIPLIER x the upper bound get
//   -BUDGET_FAR_OUT_PENALTY. "Keine Grenze" / unparseable = no effect.
// - vibeBonus: from onboarding styleVibes. Each matching vibe adds
//   +VIBE_BONUS_EACH (price/viralScore heuristics for Deals/Luxus/Premium/
//   Viral, case-insensitive tag substring match for the aesthetic vibes),
//   capped at VIBE_BONUS_CAP.
// - dwellAffinity: personal "watch time" signal. We count this user's
//   product_visible_5s events per category and add a log-scaled, capped bonus
//   to products in categories they keep lingering on - watching is interest
//   even without a like.
// - alreadySeenPenalty: pushes products already shown this session down
//   rather than hard-excluding them - with a small catalog, a fixed penalty
//   (not a hard filter) lets the feed recycle once everything unseen has been
//   shown, instead of running out of content.
// - wishlistedPenalty: products already on the user's wishlist get
//   -WISHLISTED_PENALTY. They already "own" it in their list, so the feed
//   should surface fresh things instead. (isWishlisted stays correct on the
//   DTO so the heart still renders filled if such a product does appear.)
export async function getFeedBatch({
  userId,
  excludeIds,
  limit = FEED_BATCH_SIZE,
}: GetFeedBatchOptions): Promise<ProductDTO[]> {
  const [
    products,
    wishlistRows,
    preference,
    engagementScores,
    likeCounts,
    viewCounts,
    commentCounts,
    dwellEvents,
  ] = await Promise.all([
    // Loads all active products every request. Fine at this catalog scale;
    // the take cap is a hard safety valve against unbounded growth.
    prisma.product.findMany({ where: { isActive: true }, take: PRODUCT_QUERY_CAP }),
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
    // Personal dwell signal: this user's 5s-visible events per product.
    userId
      ? prisma.userProductEvent.groupBy({
          by: ["productId"],
          where: { userId, eventType: "product_visible_5s" },
          _count: { _all: true },
        })
      : Promise.resolve([] as { productId: string; _count: { _all: number } }[]),
  ]);

  const wishlistedIds = new Set(wishlistRows.map((row) => row.productId));
  const toCountMap = (rows: { productId: string; _count: { _all: number } }[]) =>
    new Map(rows.map((row) => [row.productId, row._count._all]));
  const likeCountMap = toCountMap(likeCounts);
  const viewCountMap = toCountMap(viewCounts);
  const commentCountMap = toCountMap(commentCounts);
  const excludeSet = new Set(excludeIds);

  const categoryWeights = safeJsonParse<Record<string, number>>(preference?.categoryWeights, {});
  const tagWeights = safeJsonParse<Record<string, number>>(preference?.tagWeights, {});
  const budgetRaw = safeJsonParse<unknown[]>(preference?.budgetRange, []);
  const budget = parseBudgetRange(Array.isArray(budgetRaw) ? budgetRaw : []);
  const vibesRaw = safeJsonParse<unknown[]>(preference?.styleVibes, []);
  const vibes = (Array.isArray(vibesRaw) ? vibesRaw : []).filter((v): v is string => typeof v === "string");

  // Aggregate the per-product dwell counts up to per-category affinity using
  // the loaded products as a productId -> category lookup.
  const productCategory = new Map(products.map((p) => [p.id, p.category]));
  const dwellByCategory = new Map<string, number>();
  for (const row of dwellEvents) {
    const category = productCategory.get(row.productId);
    if (!category) continue;
    dwellByCategory.set(category, (dwellByCategory.get(category) ?? 0) + row._count._all);
  }

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
    const budgetBonus = scoreBudget(product.price, budget);
    const vibeBonus = scoreVibes(product, tags, vibes);
    const dwellCount = dwellByCategory.get(product.category) ?? 0;
    const dwellAffinity =
      dwellCount > 0 ? Math.min(DWELL_AFFINITY_CAP, Math.log2(dwellCount + 1) * DWELL_AFFINITY_FACTOR) : 0;
    const wishlistedPenalty = wishlistedIds.has(product.id) ? WISHLISTED_PENALTY : 0;

    const score =
      categoryMatch +
      tagMatch +
      product.viralScore +
      globalEngagementScore +
      noveltyBonus +
      randomExploration +
      budgetBonus +
      vibeBonus +
      dwellAffinity -
      alreadySeenPenalty -
      wishlistedPenalty;

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

type BudgetRange = { low: number; high: number } | null;

// Parses stored onboarding budget labels into a numeric [low, high] range.
// Digit-driven rather than label-hardcoded, so legacy formats ("Unter 50 €",
// "50-200 €", "Über 1000 €") still parse. "Keine Grenze" / anything without a
// usable number returns null = no budget preference.
export function parseBudgetRange(raw: unknown[]): BudgetRange {
  const label = raw.find((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (!label) return null;

  const lower = label.toLowerCase();
  if (lower.includes("grenze") || lower.includes("alles") || lower.includes("unbegrenzt")) return null;

  const numbers = (label.match(/\d+/g) ?? []).map(Number).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;

  if (numbers.length >= 2) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return { low: sorted[0], high: sorted[sorted.length - 1] };
  }

  // Single number: interpret via the surrounding words.
  const n = numbers[0];
  if (lower.includes("unter") || lower.includes("bis")) return { low: 0, high: n };
  if (lower.includes("über") || lower.includes("ueber") || lower.includes("ab ")) {
    return { low: n, high: Number.POSITIVE_INFINITY };
  }
  return { low: 0, high: n };
}

function scoreBudget(price: number, budget: BudgetRange): number {
  if (!budget) return 0;
  if (price >= budget.low && price <= budget.high) return BUDGET_IN_RANGE_BONUS;
  if (Number.isFinite(budget.high) && price > budget.high * BUDGET_FAR_MULTIPLIER) {
    return -BUDGET_FAR_OUT_PENALTY;
  }
  return 0;
}

const TAG_MATCH_VIBES = new Set(["minimal", "ästhetisch", "aesthetisch", "streetwear", "eco", "techie"]);

function scoreVibes(
  product: { price: number; viralScore: number },
  tags: string[],
  vibes: string[],
): number {
  if (vibes.length === 0) return 0;
  const lowerTags = tags.map((t) => t.toLowerCase());
  let bonus = 0;
  for (const vibe of vibes) {
    const v = vibe.toLowerCase();
    let matched = false;
    if (v === "deals" && product.price < 50) matched = true;
    else if ((v === "luxus" || v === "premium") && product.price > 300) matched = true;
    else if (v === "viral" && product.viralScore > 75) matched = true;
    else if (TAG_MATCH_VIBES.has(v) && lowerTags.some((tag) => tag.includes(v))) matched = true;

    if (matched) bonus += VIBE_BONUS_EACH;
  }
  return Math.min(VIBE_BONUS_CAP, bonus);
}

async function getGlobalEngagementScores(): Promise<Map<string, number>> {
  const recentSince = new Date(Date.now() - RECENT_ENGAGEMENT_DAYS * 24 * 60 * 60 * 1000);

  const [likeGroups, clickGroups, recentLikeGroups, recentClickGroups] = await Promise.all([
    prisma.userProductEvent.groupBy({
      by: ["productId"],
      where: { eventType: { in: ["product_like", "product_wishlist_add"] } },
      _count: { _all: true },
    }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      _count: { _all: true },
    }),
    prisma.userProductEvent.groupBy({
      by: ["productId"],
      where: { eventType: { in: ["product_like", "product_wishlist_add"] }, createdAt: { gte: recentSince } },
      _count: { _all: true },
    }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: recentSince } },
      _count: { _all: true },
    }),
  ]);

  // Affiliate clicks are weighted higher than likes - they're a stronger
  // "actually wants to buy this" signal than a tap-to-save gesture. Recent
  // events (last 7 days) are added on top of the all-time count, so they
  // effectively count double: time-decay favouring what's hot right now.
  const weighted = new Map<string, number>();
  const add = (productId: string, value: number) =>
    weighted.set(productId, (weighted.get(productId) ?? 0) + value);

  for (const group of likeGroups) add(group.productId, group._count._all * 2);
  for (const group of clickGroups) add(group.productId, group._count._all * 3);
  for (const group of recentLikeGroups) add(group.productId, group._count._all * 2);
  for (const group of recentClickGroups) add(group.productId, group._count._all * 3);

  const scores = new Map<string, number>();
  for (const [productId, value] of weighted) {
    scores.set(productId, Math.min(ENGAGEMENT_SCORE_CAP, Math.log2(value + 1) * 8));
  }
  return scores;
}
