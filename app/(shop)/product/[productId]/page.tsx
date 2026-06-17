import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/products";
import type { OfferDTO } from "@/lib/types";
import type { CommentDTO } from "@/app/api/comments/route";
import { ProductDetailView } from "@/components/product/product-detail-view";

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

  const [offers, wishlistItem, comments] = await Promise.all([
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
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
    }),
  ]);

  const productDTO = toProductDTO(product, Boolean(wishlistItem));

  const offerDTOs: OfferDTO[] = offers.map((o) => ({
    id: o.id,
    shopName: o.shopName,
    price: o.price,
    deliveryText: o.deliveryText,
    isPrimary: o.isPrimary,
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
      isLoggedIn={Boolean(userId)}
    />
  );
}
