import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleProductActive, deleteProduct } from "@/lib/admin-actions";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Produkte ({products.length})</h1>
        <Link href="/admin/products/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
          + Neues Produkt
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Kategorie</th>
              <th className="px-3 py-2">Preis</th>
              <th className="px-3 py-2">Viral</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-zinc-800">
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2 text-zinc-400">{product.category}</td>
                <td className="px-3 py-2">{product.price.toFixed(2)} €</td>
                <td className="px-3 py-2">{product.viralScore}</td>
                <td className="px-3 py-2">
                  <form action={toggleProductActive.bind(null, product.id, !product.isActive)}>
                    <button
                      type="submit"
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.isActive ? "bg-success/20 text-success" : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {product.isActive ? "Aktiv" : "Inaktiv"}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/products/${product.id}`} className="text-xs font-semibold text-accent">
                      Bearbeiten
                    </Link>
                    <DeleteProductButton productId={product.id} action={deleteProduct} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
