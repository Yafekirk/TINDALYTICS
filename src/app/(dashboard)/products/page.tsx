import type { Metadata } from "next";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { Suspense } from "react";
import { ProductsFilters } from "@/components/products/products-filters";
import { ProductsPagination } from "@/components/products/products-pagination";
import { ProductsTable } from "@/components/products/products-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import {
  listCategories,
  listProducts,
} from "@/lib/services/products";
import type {
  ProductSortDirection,
  ProductSortField,
  ProductStatusFilter,
} from "@/types/product";

export const metadata: Metadata = { title: "Products" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
};

async function ProductsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
        <p className="mt-2 text-sm text-secondary">
          We couldn&apos;t find a store for this account.
        </p>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const canManage = role === "owner" || role === "manager";

  const [categories, result] = await Promise.all([
    listCategories(store.id),
    listProducts(store.id, {
      q: params.q,
      categoryId: params.category,
      status: params.status as ProductStatusFilter | undefined,
      sort: params.sort as ProductSortField | undefined,
      dir: params.dir as ProductSortDirection | undefined,
      page,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Products</h2>
          <p className="mt-1 text-sm text-secondary">
            Manage SKUs, pricing, categories, and product images for your store.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/products/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover"
          >
            <PackagePlus className="h-4 w-4" />
            Add product
          </Link>
        ) : null}
      </section>

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <ProductsFilters categories={categories} />
      </Suspense>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Product catalog</CardTitle>
            <CardDescription>
              {result.total} product{result.total === 1 ? "" : "s"} matching your
              filters.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProductsTable products={result.items} />
          <ProductsPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            searchParams={{
              q: params.q,
              category: params.category,
              status: params.status,
              sort: params.sort,
              dir: params.dir,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ProductsContent {...props} />
    </Suspense>
  );
}
