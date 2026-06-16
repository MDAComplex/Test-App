import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/products";
import { recordPreferenceSignal } from "@/lib/preferences";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((item) => toProductDTO(item.product, true)),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId;
  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { category: true, tags: true },
  });
  if (!product) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  });
  await recordPreferenceSignal(session.user.id, product, 1);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId;
  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { category: true, tags: true },
  });

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  });
  if (product) {
    await recordPreferenceSignal(session.user.id, product, -1);
  }

  return NextResponse.json({ ok: true });
}
