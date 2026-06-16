import { createProduct } from "@/lib/admin-actions";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Neues Produkt</h1>
      <div className="mt-4">
        <ProductForm action={createProduct} submitLabel="Produkt erstellen" />
      </div>
    </div>
  );
}
