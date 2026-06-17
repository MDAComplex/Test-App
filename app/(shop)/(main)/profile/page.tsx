import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default async function ProfilePage() {
  const session = await requireUser();
  const userId = session!.user.id;

  const [wishlistCount, likeCount, clickCount] = await Promise.all([
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.userProductEvent.count({ where: { userId, eventType: "product_like" } }),
    prisma.affiliateClick.count({ where: { userId } }),
  ]);

  return (
    <div className="no-scrollbar h-dvh overflow-y-auto px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-bold">Profil</h1>

      <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
        <p className="font-semibold">{session!.user.name || session!.user.email}</p>
        {session!.user.username && (
          <p className="text-sm text-zinc-400">@{session!.user.username}</p>
        )}
        <p className="text-sm text-zinc-400">{session!.user.email}</p>
        {session!.user.role === "ADMIN" && (
          <span className="mt-2 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
            Admin
          </span>
        )}
      </div>

      <Link
        href="/onboarding"
        className="mt-4 block w-full rounded-xl border border-zinc-700 py-3 text-center font-semibold text-zinc-200"
      >
        Interessen bearbeiten
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-lg font-bold text-accent">{likeCount}</p>
          <p className="text-xs text-zinc-400">Likes</p>
        </div>
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-lg font-bold text-accent">{wishlistCount}</p>
          <p className="text-xs text-zinc-400">Wishlist</p>
        </div>
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-lg font-bold text-accent">{clickCount}</p>
          <p className="text-xs text-zinc-400">Shop-Klicks</p>
        </div>
      </div>

      {session!.user.role === "ADMIN" && (
        <Link
          href="/admin/products"
          className="mt-6 block w-full rounded-xl bg-accent py-3 text-center font-semibold text-white"
        >
          Admin-Bereich
        </Link>
      )}

      <div className="mt-8 rounded-2xl bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Passwort ändern
        </p>
        <ChangePasswordForm />
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Rechtliches
        </p>
        <div className="mt-2 flex flex-col gap-2 text-sm text-zinc-400">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/agb">AGB</Link>
          <Link href="/affiliate-hinweis">Affiliate-Hinweis</Link>
        </div>
      </div>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
