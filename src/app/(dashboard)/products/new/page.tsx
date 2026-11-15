import type { Metadata } from "next";
import { ProductForm } from "@/components/products/product-form";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listCategories, listSuppliers } from "@/lib/services/products";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const canManage = role === "owner" || role === "manager";
  const [categories, suppliers] = await Promise.all([
    listCategories(store.id),
    listSuppliers(store.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy">Add product</h2>
        <p className="mt-1 text-sm text-secondary">
          Create a new SKU with pricing, stock, and optional image.
        </p>
      </div>

      {!canManage ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You can view products, but only owners or managers can create them.
        </p>
      ) : null}

      <ProductForm
        mode="create"
        categories={categories}
        suppliers={suppliers}
        canManage={canManage}
      />
    </div>
  );
}
