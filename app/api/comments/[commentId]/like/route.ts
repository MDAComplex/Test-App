import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { commentId } = await params;
  const userId = session.user.id;

  const comment = await prisma.productComment.findUnique({
    where: { id: commentId },
    select: { id: true, isDeleted: true },
  });
  if (!comment || comment.isDeleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
    select: { id: true },
  });

  let liked: boolean;
  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.commentLike.create({ data: { commentId, userId } });
    liked = true;
  }

  const count = await prisma.commentLike.count({ where: { commentId } });

  return NextResponse.json({ liked, count });
}
