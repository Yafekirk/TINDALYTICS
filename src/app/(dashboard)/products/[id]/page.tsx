import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArchiveProductButton } from "@/components/products/archive-product-button";
import { ProductForm } from "@/components/products/product-form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import {
  getProduct,
  listCategories,
  listSuppliers,
} from "@/lib/services/products";
import { formatCurrency } from "@/lib/utils/currency";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Product Details" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ warning?: string }>;
};

async function ProductDetailContent({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const product = await getProduct(store.id, id);
  if (!product) notFound();

  const canManage = role === "owner" || role === "manager";
  const [categories, suppliers] = await Promise.all([
    listCategories(store.id),
    listSuppliers(store.id),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {product.archivedAt ? (
              <Badge tone="warning">Archived</Badge>
            ) : product.isActive ? (
              <Badge tone="success">Active</Badge>
            ) : (
              <Badge tone="default">Inactive</Badge>
            )}
            <Badge tone="info">{product.sku}</Badge>
          </div>
          <h2 className="text-xl font-semibold text-navy">{product.name}</h2>
          <p className="mt-1 text-sm text-secondary">
            {product.categoryName ?? "Uncategorized"} · Stock {product.stock}{" "}
            {product.unit} · {formatCurrency(product.sellingPrice)}
          </p>
        </div>
        {canManage ? (
          <ArchiveProductButton
            productId={product.id}
            archived={Boolean(product.archivedAt)}
          />
        ) : null}
      </section>

      {query.warning ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Product saved, but image upload failed: {query.warning}
        </p>
      ) : null}

      {!canManage ? (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-secondary">
          You have view-only access. Ask an owner or manager to edit products.
        </p>
      ) : null}

      <ProductForm
        mode="edit"
        product={product}
        categories={categories}
        suppliers={suppliers}
        canManage={canManage}
      />
    </div>
  );
}

export default function ProductDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <ProductDetailContent {...props} />
    </Suspense>
  );
}
