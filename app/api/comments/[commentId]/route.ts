import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { commentId } = await params;

  const comment = await prisma.productComment.findUnique({
    where: { id: commentId },
    select: { userId: true, isDeleted: true },
  });

  if (!comment || comment.isDeleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.productComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });

  return NextResponse.json({ ok: true });
}
