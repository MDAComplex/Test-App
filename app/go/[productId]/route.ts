import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";

// Single-purpose redirect: log the affiliate click (+ a matching engagement
// event), then immediately 302 to the real affiliate URL. No intermediate
// page, no popup. The real affiliateUrl never reaches the client otherwise -
// this route is the only place it's read.
export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.redirect(new URL("/feed", request.nextUrl));
  }

  try {
    const [session, sessionId] = await Promise.all([auth(), getSessionId()]);
    const referrer = request.headers.get("referer") ?? undefined;
    const userId = session?.user?.id;

    await Promise.all([
      prisma.affiliateClick.create({
        data: {
          productId: product.id,
          affiliateUrl: product.affiliateUrl,
          sessionId,
          userId,
          referrer,
        },
      }),
      prisma.userProductEvent.create({
        data: {
          productId: product.id,
          eventType: "product_affiliate_click",
          sessionId,
          userId,
        },
      }),
    ]);
  } catch {
    // Tracking must never block the redirect to the shop.
  }

  return NextResponse.redirect(product.affiliateUrl, 302);
}
