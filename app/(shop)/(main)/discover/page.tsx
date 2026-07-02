import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProductCounts } from "@/lib/feed";
import { toProductDTO } from "@/lib/products";
import { DiscoverClient } from "@/components/discover/discover-client";

const TRENDING_LIMIT = 30;

export default async function DiscoverPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [products, categoryGroups] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { viralScore: "desc" },
      take: TRENDING_LIMIT,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const productIds = products.map((p) => p.id);
  const [counts, wishlistRows] = await Promise.all([
    getProductCounts(productIds),
    userId
      ? prisma.wishlistItem.findMany({
          where: { userId, productId: { in: productIds } },
          select: { productId: true },
        })
      : Promise.resolve([] as { productId: string }[]),
  ]);

  const wishlistedIds = new Set(wishlistRows.map((row) => row.productId));

  const initialItems = products.map((product) =>
    toProductDTO(product, wishlistedIds.has(product.id), {
      likeCount: counts.likeCountMap.get(product.id) ?? 0,
      viewCount: counts.viewCountMap.get(product.id) ?? 0,
      commentCount: counts.commentCountMap.get(product.id) ?? 0,
    }),
  );

  const categories = categoryGroups.map((row) => row.category);

  return <DiscoverClient initialItems={initialItems} categories={categories} />;
}
