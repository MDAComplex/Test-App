"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { serializeTags } from "@/lib/products";

type MediaType = "image" | "video";
type MediaFit = "cover" | "hybrid" | "contain" | "auto";

function parseProductForm(formData: FormData) {
  const str = (key: string) => (formData.get(key) ?? "").toString().trim();
  const optionalStr = (key: string) => {
    const value = str(key);
    return value.length > 0 ? value : null;
  };
  const mediaFitValue = str("mediaFit");

  return {
    name: str("name"),
    description: str("description"),
    price: Number(str("price")) || 0,
    category: str("category"),
    imageUrl: str("imageUrl"),
    videoUrl: optionalStr("videoUrl"),
    posterUrl: optionalStr("posterUrl"),
    mediaType: (str("mediaType") === "video" ? "video" : "image") as MediaType,
    mediaFit: (["cover", "hybrid", "contain", "auto"].includes(mediaFitValue) ? mediaFitValue : "hybrid") as MediaFit,
    affiliateUrl: str("affiliateUrl"),
    shopName: str("shopName"),
    deliveryTime: optionalStr("deliveryTime"),
    tags: serializeTags(str("tags").split(",")),
    viralScore: Math.max(0, Math.min(100, Math.round(Number(str("viralScore")) || 0))),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const data = parseProductForm(formData);
  await prisma.product.create({ data });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseProductForm(formData);
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductActive(id: string, nextActive: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { isActive: nextActive } });
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}
