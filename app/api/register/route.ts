import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage." }, { status: 400 });
  }

  const { email, password, name, username } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    username?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Bitte einen Namen angeben." }, { status: 400 });
  }
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "username_invalid" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Bitte eine gueltige E-Mail-Adresse angeben." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Diese E-Mail wird bereits verwendet." }, { status: 409 });
  }

  const usernameTaken = await prisma.user.findUnique({ where: { username } });
  if (usernameTaken) {
    return NextResponse.json({ error: "username_taken" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      username,
      role: "USER",
    },
  });

  return NextResponse.json({ ok: true });
}
