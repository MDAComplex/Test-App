import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_LEN = 500;
// Lightweight spam guard: at most this many comments per user per window.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export type CommentDTO = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorUsername: string | null;
  likeCount: number;
  isLikedByMe: boolean;
  isMine: boolean;
};

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  const comments = await prisma.productComment.findMany({
    where: { productId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, username: true } },
      _count: { select: { likes: true } },
      ...(userId ? { likes: { where: { userId }, select: { id: true } } } : {}),
    },
  });

  const items: CommentDTO[] = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorName: c.user.name ?? c.user.username ?? "Nutzer",
    authorUsername: c.user.username,
    likeCount: c._count.likes,
    isLikedByMe: userId ? (c.likes?.length ?? 0) > 0 : false,
    isMine: userId === c.userId,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId;
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }
  if (!content || content.length > MAX_LEN) {
    return NextResponse.json({ error: "invalid_content" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  // Rate-limit-lite: reject if the user has posted too many comments recently.
  const recentCount = await prisma.productComment.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const created = await prisma.productComment.create({
    data: { productId, userId: session.user.id, content },
    include: {
      user: { select: { name: true, username: true } },
    },
  });

  const dto: CommentDTO = {
    id: created.id,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    authorName: created.user.name ?? created.user.username ?? "Nutzer",
    authorUsername: created.user.username,
    likeCount: 0,
    isLikedByMe: false,
    isMine: true,
  };

  return NextResponse.json({ comment: dto });
}
