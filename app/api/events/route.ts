import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";
import { isEventType } from "@/lib/events";

// Tracking must never break the feed: any malformed input or DB hiccup here
// resolves to a 200/ok:false rather than surfacing as a network error, since
// callers fire-and-forget these requests.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const productId = body?.productId;
    const eventType = body?.eventType;
    const metadata = body?.metadata;

    if (typeof productId !== "string" || !productId || !isEventType(eventType)) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const [session, sessionId] = await Promise.all([auth(), getSessionId()]);

    await prisma.userProductEvent.create({
      data: {
        productId,
        eventType,
        sessionId,
        userId: session?.user?.id,
        metadata: metadata ? JSON.stringify(metadata).slice(0, 2000) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
