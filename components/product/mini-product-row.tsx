import Link from "next/link";

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export type MiniProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  posterUrl: string | null;
};

type MiniProductRowProps = {
  title: string;
  products: MiniProduct[];
};

// Horizontal scroll row of small product cards. Presentational only (no client
// hooks), so it works in both server components (profile) and client components
// (product detail view).
export function MiniProductRow({ title, products }: MiniProductRowProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex w-32 shrink-0 flex-col overflow-hidden rounded-2xl bg-zinc-900"
          >
            <div className="aspect-[3/4] w-full bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.posterUrl ?? product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <p className="line-clamp-2 text-xs font-semibold leading-tight">{product.name}</p>
              <p className="text-xs font-bold text-accent">{currency.format(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
