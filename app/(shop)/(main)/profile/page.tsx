import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { HeartIcon, ShopBagIcon } from "@/components/icons";

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export default async function ProfilePage() {
  const session = await requireUser();
  const userId = session!.user.id;

  const [wishlistCount, likeCount, clickCount] = await Promise.all([
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.userProductEvent.count({ where: { userId, eventType: "product_like" } }),
    prisma.affiliateClick.count({ where: { userId } }),
  ]);

  const displayName = session!.user.name || session!.user.username || session!.user.email || "?";
  const initial = displayName.slice(0, 1).toUpperCase();

  const stats = [
    { label: "Likes", value: likeCount, icon: <HeartIcon filled className="h-5 w-5 text-rose-400" />, ring: "border-rose-500/30" },
    { label: "Wishlist", value: wishlistCount, icon: <BookmarkIcon className="h-5 w-5 text-amber-400" />, ring: "border-amber-500/30" },
    { label: "Shop-Klicks", value: clickCount, icon: <ShopBagIcon className="h-5 w-5 text-emerald-400" />, ring: "border-emerald-500/30" },
  ];

  return (
    <div className="no-scrollbar h-dvh overflow-y-auto px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-bold">Profil</h1>

      {/* Identity card */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 ring-1 ring-zinc-800">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-fuchsia-600 text-2xl font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{session!.user.name || session!.user.email}</p>
          {session!.user.username && <p className="truncate text-sm text-zinc-400">@{session!.user.username}</p>}
          <p className="truncate text-sm text-zinc-500">{session!.user.email}</p>
          {session!.user.role === "ADMIN" && (
            <span className="mt-1.5 inline-block rounded-full bg-accent/20 px-3 py-0.5 text-xs font-semibold text-accent">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border bg-zinc-900/60 p-3 text-center ${s.ring}`}
          >
            {s.icon}
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[11px] text-zinc-400">{s.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="mt-4 block w-full rounded-xl border border-zinc-700 py-3 text-center font-semibold text-zinc-200 active:scale-[0.98] transition-transform"
      >
        Interessen bearbeiten
      </Link>

      {session!.user.role === "ADMIN" && (
        <Link
          href="/admin/products"
          className="mt-3 block w-full rounded-xl bg-accent py-3 text-center font-semibold text-white active:scale-[0.98] transition-transform"
        >
          Admin-Bereich
        </Link>
      )}

      {/* Password section */}
      <div className="mt-8">
        <h2 className="mb-2 border-b border-zinc-800 pb-2 text-sm font-bold uppercase tracking-wide text-zinc-300">
          Passwort ändern
        </h2>
        <div className="rounded-2xl bg-zinc-900 p-4">
          <ChangePasswordForm />
        </div>
      </div>

      {/* Legal section */}
      <div className="mt-8">
        <h2 className="mb-2 border-b border-zinc-800 pb-2 text-sm font-bold uppercase tracking-wide text-zinc-300">
          Rechtliches
        </h2>
        <div className="flex flex-col divide-y divide-zinc-800 rounded-2xl bg-zinc-900 px-4 text-sm text-zinc-300">
          <Link href="/impressum" className="py-3">Impressum</Link>
          <Link href="/datenschutz" className="py-3">Datenschutz</Link>
          <Link href="/agb" className="py-3">AGB</Link>
          <Link href="/affiliate-hinweis" className="py-3">Affiliate-Hinweis</Link>
        </div>
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
