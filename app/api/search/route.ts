import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProductCounts } from "@/lib/feed";
import { toProductDTO } from "@/lib/products";
import type { Prisma } from "@/generated/prisma/client";

const SEARCH_LIMIT = 30;
const MAX_QUERY_LEN = 100;
const MAX_CATEGORY_LEN = 60;

// GET /api/search?q=&category=
// Case-insensitive contains match on name/description/tags (SQLite LIKE is
// case-insensitive for ASCII), optional category filter, active products only,
// ordered by viralScore. Returns ProductDTOs with real social-proof counts.
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const category = (request.nextUrl.searchParams.get("category") ?? "").trim();

  // Reject absurd input outright instead of running a pointless huge LIKE.
  if (q.length > MAX_QUERY_LEN || category.length > MAX_CATEGORY_LEN) {
    return NextResponse.json({ error: "query_too_long" }, { status: 400 });
  }

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { viralScore: "desc" },
    take: SEARCH_LIMIT,
  });

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

  const items = products.map((product) =>
    toProductDTO(product, wishlistedIds.has(product.id), {
      likeCount: counts.likeCountMap.get(product.id) ?? 0,
      viewCount: counts.viewCountMap.get(product.id) ?? 0,
      commentCount: counts.commentCountMap.get(product.id) ?? 0,
    }),
  );

  return NextResponse.json({ items });
}
