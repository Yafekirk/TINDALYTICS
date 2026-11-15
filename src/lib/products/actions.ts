"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { parseProductFormData } from "@/lib/validations/product";

export type ProductActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function requireManager(role: string | null) {
  return role === "owner" || role === "manager";
}

async function resolveCategoryId(
  storeId: string,
  categoryId: string | null,
  newCategoryName: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ id: string | null; error?: string }> {
  if (categoryId) {
    return { id: categoryId };
  }

  if (newCategoryName) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", storeId)
      .ilike("name", newCategoryName)
      .maybeSingle();

    if (existing?.id) return { id: existing.id };

    const { data: created, error } = await supabase
      .from("categories")
      .insert({ store_id: storeId, name: newCategoryName })
      .select("id")
      .single();

    if (error || !created) {
      return { id: null, error: error?.message ?? "Unable to create category" };
    }

    return { id: created.id };
  }

  return { id: null };
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can add products." };
  }

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid product details",
      fieldErrors,
    };
  }

  const input = parsed.data;
  const category = await resolveCategoryId(
    store.id,
    input.categoryId,
    input.newCategoryName,
    supabase,
  );

  if (category.error || !category.id) {
    return { error: category.error ?? "Category is required" };
  }

  const { data: duplicate } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", store.id)
    .eq("sku", input.sku)
    .maybeSingle();

  if (duplicate) {
    return {
      error: "A product with this SKU already exists in your store.",
      fieldErrors: { sku: "SKU must be unique within your store" },
    };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      category_id: category.id,
      supplier_id: input.supplierId,
      name: input.name,
      sku: input.sku,
      barcode: input.barcode,
      description: input.description,
      cost_price: input.costPrice,
      selling_price: input.sellingPrice,
      unit: input.unit,
      min_stock_level: input.minStockLevel,
      is_active: input.isActive,
    })
    .select("id")
    .single();

  if (error || !product) {
    if (error?.code === "23505") {
      return {
        error: "A product with this SKU already exists in your store.",
        fieldErrors: { sku: "SKU must be unique within your store" },
      };
    }
    return { error: error?.message ?? "Unable to create product" };
  }

  const initialStock = input.initialStock ?? 0;
  const { error: inventoryError } = await supabase.from("inventory").insert({
    store_id: store.id,
    product_id: product.id,
    quantity: initialStock,
  });

  if (inventoryError) {
    console.error("inventory create:", inventoryError.message);
  } else if (initialStock > 0) {
    await supabase.from("inventory_movements").insert({
      store_id: store.id,
      product_id: product.id,
      movement_type: "stock_in",
      quantity: initialStock,
      reference_type: "product_create",
      reference_id: product.id,
      notes: "Initial stock on product create",
    });
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploadResult = await uploadProductImage(store.id, product.id, image);
    if (!uploadResult.ok) {
      revalidatePath("/products");
      redirect(`/products/${product.id}?warning=${encodeURIComponent(uploadResult.message)}`);
    }
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  redirect(`/products/${product.id}`);
}

export async function updateProductAction(
  productId: string,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can edit products." };
  }

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid product details",
      fieldErrors,
    };
  }

  const input = parsed.data;
  const category = await resolveCategoryId(
    store.id,
    input.categoryId,
    input.newCategoryName,
    supabase,
  );

  if (category.error || !category.id) {
    return { error: category.error ?? "Category is required" };
  }

  const { data: duplicate } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", store.id)
    .eq("sku", input.sku)
    .neq("id", productId)
    .maybeSingle();

  if (duplicate) {
    return {
      error: "A product with this SKU already exists in your store.",
      fieldErrors: { sku: "SKU must be unique within your store" },
    };
  }

  const { error } = await supabase
    .from("products")
    .update({
      category_id: category.id,
      supplier_id: input.supplierId,
      name: input.name,
      sku: input.sku,
      barcode: input.barcode,
      description: input.description,
      cost_price: input.costPrice,
      selling_price: input.sellingPrice,
      unit: input.unit,
      min_stock_level: input.minStockLevel,
      is_active: input.isActive,
    })
    .eq("store_id", store.id)
    .eq("id", productId);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A product with this SKU already exists in your store.",
        fieldErrors: { sku: "SKU must be unique within your store" },
      };
    }
    return { error: error.message };
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploadResult = await uploadProductImage(store.id, productId, image);
    if (!uploadResult.ok) {
      return { error: uploadResult.message };
    }
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/dashboard");
  return { success: "Product updated successfully." };
}

export async function archiveProductAction(
  productId: string,
): Promise<ProductActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can archive products." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      archived_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("store_id", store.id)
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/dashboard");
  return { success: "Product archived." };
}

export async function restoreProductAction(
  productId: string,
): Promise<ProductActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can restore products." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      archived_at: null,
      is_active: true,
    })
    .eq("store_id", store.id)
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/dashboard");
  return { success: "Product restored." };
}

async function uploadProductImage(
  storeId: string,
  productId: string,
  file: File,
): Promise<{ ok: boolean; message: string }> {
  const { supabase } = await getCurrentStoreContext();

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return { ok: false, message: "Image must be JPEG, PNG, WebP, or GIF." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Image must be 5MB or smaller." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${storeId}/${productId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("products")
    .update({ image_url: publicUrl })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  return { ok: true, message: "Image uploaded." };
}
