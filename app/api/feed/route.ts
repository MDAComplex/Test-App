import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFeedBatch } from "@/lib/feed";

export async function GET(request: NextRequest) {
  const session = await auth();
  const excludeParam = request.nextUrl.searchParams.get("exclude") ?? "";
  const excludeIds = excludeParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    // Cap the exclude list so the query string can't grow unbounded as a user
    // scrolls forever; the last 200 seen ids are plenty to avoid repeats.
    .slice(-200);

  const items = await getFeedBatch({
    userId: session?.user?.id ?? null,
    excludeIds,
  });

  return NextResponse.json({ items });
}
