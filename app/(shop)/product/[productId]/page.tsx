import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/products";
import type { OfferDTO } from "@/lib/types";
import type { CommentDTO } from "@/app/api/comments/route";
import { ProductDetailView } from "@/components/product/product-detail-view";
import type { MiniProduct } from "@/components/product/mini-product-row";

const RELATED_LIMIT = 6;

function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !product.isActive) {
    return { title: "Produkt nicht gefunden – Wishlist Wars" };
  }

  const description = truncate(product.description);
  return {
    title: `${product.name} – Wishlist Wars`,
    description,
    openGraph: {
      title: `${product.name} – Wishlist Wars`,
      description,
      images: [{ url: product.posterUrl ?? product.imageUrl }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  const [offers, wishlistItem, comments, sameCategory] = await Promise.all([
    prisma.productOffer.findMany({
      where: { productId },
      orderBy: [{ isPrimary: "desc" }, { price: "asc" }],
    }),
    userId
      ? prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId, productId } },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.productComment.findMany({
      where: { productId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, username: true } },
        _count: { select: { likes: true } },
        ...(userId ? { likes: { where: { userId }, select: { id: true } } } : {}),
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, category: product.category, id: { not: productId } },
      orderBy: { viralScore: "desc" },
      take: RELATED_LIMIT,
    }),
  ]);

  // Fill up to RELATED_LIMIT with top products from any category if this
  // category is thin, so the row never looks empty.
  let related = sameCategory;
  if (related.length < RELATED_LIMIT) {
    const excludeIds = [productId, ...related.map((p) => p.id)];
    const fill = await prisma.product.findMany({
      where: { isActive: true, id: { notIn: excludeIds } },
      orderBy: { viralScore: "desc" },
      take: RELATED_LIMIT - related.length,
    });
    related = [...related, ...fill];
  }

  const productDTO = toProductDTO(product, Boolean(wishlistItem));

  const offerDTOs: OfferDTO[] = offers.map((o) => ({
    id: o.id,
    shopName: o.shopName,
    price: o.price,
    deliveryText: o.deliveryText,
    isPrimary: o.isPrimary,
  }));

  const relatedProducts: MiniProduct[] = related.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    posterUrl: p.posterUrl,
  }));

  const commentDTOs: CommentDTO[] = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorName: c.user.name ?? c.user.username ?? "Nutzer",
    authorUsername: c.user.username,
    likeCount: c._count.likes,
    isLikedByMe: userId ? (c.likes?.length ?? 0) > 0 : false,
    isMine: userId === c.userId,
  }));

  return (
    <ProductDetailView
      product={productDTO}
      offers={offerDTOs}
      initialComments={commentDTOs}
      relatedProducts={relatedProducts}
      isLoggedIn={Boolean(userId)}
    />
  );
}
