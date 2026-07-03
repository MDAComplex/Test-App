import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct, createOffer, deleteOffer } from "@/lib/admin-actions";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteOfferButton } from "@/components/admin/delete-offer-button";

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, offers] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productOffer.findMany({
      where: { productId: id },
      orderBy: [{ isPrimary: "desc" }, { price: "asc" }],
    }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold">Produkt bearbeiten</h1>
      <div className="mt-4">
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          submitLabel="Speichern"
          initial={{
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl,
            videoUrl: product.videoUrl,
            posterUrl: product.posterUrl,
            mediaType: product.mediaType,
            mediaFit: product.mediaFit,
            affiliateUrl: product.affiliateUrl,
            shopName: product.shopName,
            deliveryTime: product.deliveryTime,
            tags: product.tags,
            viralScore: product.viralScore,
            isActive: product.isActive,
          }}
        />
      </div>

      {/* Offers */}
      <div className="mt-10 max-w-xl">
        <h2 className="text-lg font-bold">Angebote ({offers.length})</h2>

        {offers.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Noch keine Angebote für dieses Produkt.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {offers.map((offer) => (
              <li
                key={offer.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{offer.shopName}</p>
                    {offer.isPrimary && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Primaer
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-accent">{currency.format(offer.price)}</p>
                  {offer.deliveryText && <p className="text-xs text-zinc-500">{offer.deliveryText}</p>}
                </div>
                <DeleteOfferButton offerId={offer.id} productId={product.id} action={deleteOffer} />
              </li>
            ))}
          </ul>
        )}

        {/* Add offer form */}
        <form action={createOffer.bind(null, product.id)} className="mt-5 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="text-sm font-bold">Neues Angebot</h3>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Shopname
              <input
                type="text"
                name="shopName"
                required
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Preis (€)
              <input
                type="number"
                name="price"
                step="any"
                required
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Affiliate-URL
            <input
              type="text"
              name="affiliateUrl"
              required
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Lieferzeit (optional)
            <input
              type="text"
              name="deliveryText"
              placeholder="z. B. 2-3 Werktage"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-accent"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPrimary" />
            Als Hauptangebot markieren
          </label>

          <button type="submit" className="mt-1 rounded-xl bg-accent py-2.5 font-semibold text-white">
            Angebot hinzufuegen
          </button>
        </form>
      </div>
    </div>
  );
}
