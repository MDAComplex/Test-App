import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/products";
import { safeJsonParse } from "@/lib/json";

type PreferenceSignalProduct = {
  category: string;
  tags: string;
};

// Called whenever a user adds/removes a wishlist item (our only "this
// product is relevant to me" signal in this MVP). Nudges that
// category's/tag's weight up or down so the feed's categoryMatch/tagMatch
// terms (lib/feed.ts) reflect what this user actually engages with.
export async function recordPreferenceSignal(
  userId: string,
  product: PreferenceSignalProduct,
  direction: 1 | -1,
) {
  const existing = await prisma.userPreference.findUnique({ where: { userId } });
  const categoryWeights = safeJsonParse<Record<string, number>>(existing?.categoryWeights, {});
  const tagWeights = safeJsonParse<Record<string, number>>(existing?.tagWeights, {});

  categoryWeights[product.category] = Math.max(0, (categoryWeights[product.category] ?? 0) + direction);
  for (const tag of parseTags(product.tags)) {
    tagWeights[tag] = Math.max(0, (tagWeights[tag] ?? 0) + direction);
  }

  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      categoryWeights: JSON.stringify(categoryWeights),
      tagWeights: JSON.stringify(tagWeights),
    },
    update: {
      categoryWeights: JSON.stringify(categoryWeights),
      tagWeights: JSON.stringify(tagWeights),
    },
  });
}
