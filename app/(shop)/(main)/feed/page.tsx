import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFeedBatch } from "@/lib/feed";
import { FeedClient } from "@/components/feed/feed-client";

export default async function FeedPage() {
  const session = await auth();
  const [items, totalCount] = await Promise.all([
    getFeedBatch({ userId: session?.user?.id ?? null, excludeIds: [] }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  return <FeedClient initialItems={items} totalCount={totalCount} />;
}
