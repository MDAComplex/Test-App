"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FeedIcon, HeartIcon, UserIcon } from "@/components/icons";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", Icon: FeedIcon },
  { href: "/wishlist", label: "Wishlist", Icon: HeartIcon },
  { href: "/profile", label: "Profil", Icon: UserIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center gap-6 rounded-full border border-white/10 bg-black/70 px-6 py-2.5 backdrop-blur-md">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-[11px] transition ${
                active ? "text-accent" : "text-zinc-400"
              }`}
            >
              <Icon className="h-5 w-5" filled={active} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
