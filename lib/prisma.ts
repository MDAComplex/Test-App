import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as fs from "fs";
import * as path from "path";

// Single PrismaClient instance reused across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  // On Vercel, /var/task is read-only. Copy the pre-seeded DB to writable /tmp
  // once per container instance so reads AND writes work during the session.
  if (process.env.VERCEL && url.startsWith("file:")) {
    const tmpPath = "/tmp/dev.db";
    if (!fs.existsSync(tmpPath)) {
      fs.copyFileSync(path.join(process.cwd(), "dev.db"), tmpPath);
    }
    return `file:${tmpPath}`;
  }
  return url;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: getDbUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
