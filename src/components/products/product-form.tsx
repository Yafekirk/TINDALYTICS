"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/lib/products/actions";
import {
  PRODUCT_UNITS,
  productSchema,
  type ProductInput,
} from "@/lib/validations/product";
import type { CategoryOption, ProductDetail, SupplierOption } from "@/types/product";

type ProductFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  suppliers: SupplierOption[];
  product?: ProductDetail;
  canManage: boolean;
};

export function ProductForm({
  mode,
  categories,
  suppliers,
  product,
  canManage,
}: ProductFormProps) {
  const [serverState, setServerState] = useState<ProductActionState>({});
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaults = useMemo<ProductInput>(
    () => ({
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? null,
      categoryId: product?.categoryId ?? null,
      newCategoryName: null,
      description: product?.description ?? null,
      costPrice: product?.costPrice ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      unit: (PRODUCT_UNITS.includes(product?.unit as (typeof PRODUCT_UNITS)[number])
        ? product?.unit
        : "pc") as ProductInput["unit"],
      supplierId: product?.supplierId ?? null,
      minStockLevel: product?.minStockLevel ?? 0,
      isActive: product?.isActive ?? true,
      initialStock: product?.stock ?? 0,
    }),
    [product],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: defaults,
  });

  function onSubmit(values: ProductInput) {
    if (!canManage) return;

    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("sku", values.sku);
    formData.set("barcode", values.barcode ?? "");
    formData.set("categoryId", values.categoryId ?? "");
    formData.set("newCategoryName", values.newCategoryName ?? "");
    formData.set("description", values.description ?? "");
    formData.set("costPrice", String(values.costPrice));
    formData.set("sellingPrice", String(values.sellingPrice));
    formData.set("unit", values.unit);
    formData.set("supplierId", values.supplierId ?? "");
    formData.set("minStockLevel", String(values.minStockLevel));
    formData.set("isActive", values.isActive ? "true" : "false");
    formData.set("initialStock", String(values.initialStock ?? 0));
    if (imageFile) formData.set("image", imageFile);

    startTransition(async () => {
      setServerState({});
      const result =
        mode === "create"
          ? await createProductAction({}, formData)
          : await updateProductAction(product!.id, {}, formData);
      if (result) setServerState(result);
    });
  }

  const fieldError = (name: keyof ProductInput) =>
    errors[name]?.message || serverState.fieldErrors?.[name];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                disabled={!canManage}
                placeholder="Coca-Cola 1.5L"
                {...register("name")}
              />
              {fieldError("name") ? (
                <p className="mt-1 text-xs text-danger">{fieldError("name")}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                disabled={!canManage}
                placeholder="BEV-COKE-15"
                {...register("sku")}
              />
              {fieldError("sku") ? (
                <p className="mt-1 text-xs text-danger">{fieldError("sku")}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                disabled={!canManage}
                placeholder="Optional"
                {...register("barcode")}
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                id="categoryId"
                disabled={!canManage}
                {...register("categoryId")}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {fieldError("categoryId") ? (
                <p className="mt-1 text-xs text-danger">
                  {fieldError("categoryId")}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="newCategoryName">Or create category</Label>
              <Input
                id="newCategoryName"
                disabled={!canManage}
                placeholder="e.g. Beverages"
                {...register("newCategoryName")}
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select id="unit" disabled={!canManage} {...register("unit")}>
                {PRODUCT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                id="supplierId"
                disabled={!canManage}
                {...register("supplierId")}
              >
                <option value="">No supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="costPrice">Cost price (₱)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                disabled={!canManage}
                {...register("costPrice")}
              />
              {fieldError("costPrice") ? (
                <p className="mt-1 text-xs text-danger">
                  {fieldError("costPrice")}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="sellingPrice">Selling price (₱)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                disabled={!canManage}
                {...register("sellingPrice")}
              />
              {fieldError("sellingPrice") ? (
                <p className="mt-1 text-xs text-danger">
                  {fieldError("sellingPrice")}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="minStockLevel">Minimum stock level</Label>
              <Input
                id="minStockLevel"
                type="number"
                step="1"
                min="0"
                disabled={!canManage}
                {...register("minStockLevel")}
              />
            </div>

            {mode === "create" ? (
              <div>
                <Label htmlFor="initialStock">Initial stock</Label>
                <Input
                  id="initialStock"
                  type="number"
                  step="1"
                  min="0"
                  disabled={!canManage}
                  {...register("initialStock")}
                />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                disabled={!canManage}
                placeholder="Optional product notes"
                {...register("description")}
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary"
                disabled={!canManage}
                {...register("isActive")}
              />
              <Label htmlFor="isActive" className="mb-0">
                Active (available for sale)
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-navy">Product image</h3>
            <p className="mt-1 text-xs text-secondary">
              JPEG, PNG, WebP, or GIF up to 5MB.
            </p>
          </div>

          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-page">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Product preview"
                fill
                className="object-cover"
                unoptimized={imagePreview.startsWith("blob:")}
                sizes="280px"
              />
            ) : (
              <p className="px-4 text-center text-sm text-secondary">
                No image uploaded
              </p>
            )}
          </div>

          {canManage ? (
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
          ) : null}
        </div>
      </div>

      {serverState.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverState.error}
        </p>
      ) : null}
      {serverState.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-primary">
          {serverState.success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {canManage ? (
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create product"
                : "Save changes"}
          </Button>
        ) : null}
        <Link
          href="/products"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Back to products
        </Link>
      </div>
    </form>
  );
}
