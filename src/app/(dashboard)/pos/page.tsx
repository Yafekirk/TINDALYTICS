import type { Metadata } from "next";
import { Suspense } from "react";
import { PosTerminal } from "@/components/pos/pos-terminal";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listCategories } from "@/lib/services/products";
import { listPosProducts } from "@/lib/services/pos";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Point of Sale" };

async function PosContent() {
  const { store, role, user } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const [products, categories] = await Promise.all([
    listPosProducts(store.id),
    listCategories(store.id),
  ]);

  const cashierName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Cashier";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-navy">Point of Sale</h2>
        <p className="mt-1 text-sm text-secondary">
          Search products, build a cart, and complete checkout securely.
        </p>
      </div>

      <PosTerminal
        products={products}
        categories={categories}
        canDiscount={role === "owner" || role === "manager"}
        cashierName={cashierName}
      />
    </div>
  );
}

export default function PosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-[70vh] w-full rounded-2xl" />
        </div>
      }
    >
      <PosContent />
    </Suspense>
  );
}
