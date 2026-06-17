import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { currentPassword, newPassword } = body ?? {};

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "wrong_password" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return NextResponse.json({ ok: true });
}
