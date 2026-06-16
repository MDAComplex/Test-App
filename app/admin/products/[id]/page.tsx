import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/admin-actions";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
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
            tags: product.tags,
            viralScore: product.viralScore,
            isActive: product.isActive,
          }}
        />
      </div>
    </div>
  );
}
