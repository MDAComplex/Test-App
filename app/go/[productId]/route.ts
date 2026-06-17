import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";

// Single-purpose redirect: log the affiliate click (+ a matching engagement
// event), then immediately 302 to the real affiliate URL. No intermediate
// page, no popup. The real affiliateUrl never reaches the client otherwise -
// this route is the only place it's read.
//
// An optional `?offerId=` selects a specific ProductOffer's affiliate URL
// (the product detail page lists multiple shop offers); without it we fall
// back to the product's own affiliateUrl.
export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.redirect(new URL("/feed", request.nextUrl));
  }

  let targetUrl = product.affiliateUrl;
  const offerId = request.nextUrl.searchParams.get("offerId");
  if (offerId) {
    const offer = await prisma.productOffer.findFirst({
      where: { id: offerId, productId: product.id },
      select: { affiliateUrl: true },
    });
    if (offer) {
      targetUrl = offer.affiliateUrl;
    }
  }

  try {
    const [session, sessionId] = await Promise.all([auth(), getSessionId()]);
    const referrer = request.headers.get("referer") ?? undefined;
    const userId = session?.user?.id;

    await Promise.all([
      prisma.affiliateClick.create({
        data: {
          productId: product.id,
          affiliateUrl: targetUrl,
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
          metadata: offerId ? JSON.stringify({ offerId }) : null,
        },
      }),
    ]);
  } catch {
    // Tracking must never block the redirect to the shop.
  }

  return NextResponse.redirect(targetUrl, 302);
}
