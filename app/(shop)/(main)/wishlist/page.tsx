import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/products";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-8 pb-24 text-center">
        <h1 className="text-xl font-bold">Deine Wishlist</h1>
        <p className="text-sm text-zinc-400">
          Erstelle einen kostenlosen Account, um deine Wishlist zu speichern und zu sehen.
        </p>
        <Link
          href="/register"
          className="w-full max-w-xs rounded-xl bg-accent py-3 text-center font-semibold text-white"
        >
          Account erstellen
        </Link>
        <Link href="/login" className="text-sm text-zinc-500 underline">
          Ich habe schon einen Account
        </Link>
      </div>
    );
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const products = wishlistItems.map((item) => toProductDTO(item.product, true));

  return <WishlistView initialItems={products} />;
}
