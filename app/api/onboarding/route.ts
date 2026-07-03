import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/json";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ completed: false });
  }

  const pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompleted: true },
  });

  return NextResponse.json({ completed: pref?.onboardingCompleted ?? false });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const categories = Array.isArray(body?.categories)
    ? (body.categories as unknown[]).filter((c): c is string => typeof c === "string")
    : [];
  const budget = typeof body?.budget === "string" ? body.budget : "";
  const vibes = Array.isArray(body?.vibes)
    ? (body.vibes as unknown[]).filter((v): v is string => typeof v === "string")
    : [];

  const userId = session.user.id;
  const existing = await prisma.userPreference.findUnique({ where: { userId } });
  const categoryWeights = safeJsonParse<Record<string, number>>(existing?.categoryWeights, {});

  // Strong explicit signal from onboarding selection.
  for (const category of categories) {
    categoryWeights[category] = 3;
  }

  const data = {
    onboardingCompleted: true,
    budgetRange: JSON.stringify(budget ? [budget] : []),
    styleVibes: JSON.stringify(vibes),
    categoryWeights: JSON.stringify(categoryWeights),
  };

  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
