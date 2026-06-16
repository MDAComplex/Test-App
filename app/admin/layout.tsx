import Link from "next/link";
import { requireAdmin } from "@/lib/authz";

// Defense in depth, layer 2: `proxy.ts` already blocks `/admin/*` for
// non-admins at the network edge; this layout re-checks the role on every
// admin page/Server Component render so a Proxy matcher gap (or a directly
// invoked Server Action) can't expose admin data either.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <Link href="/admin/products" className="font-bold">
          Wishlist Wars <span className="text-accent">Admin</span>
        </Link>
        <Link href="/feed" className="text-sm text-zinc-400 underline">
          Zur App
        </Link>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
