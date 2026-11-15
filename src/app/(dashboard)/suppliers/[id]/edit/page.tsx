import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getSupplier } from "@/lib/services/suppliers";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Edit supplier" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSupplierPage({ params }: PageProps) {
  const { id } = await params;
  const { store, role } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const supplier = await getSupplier(store.id, id);
  if (!supplier) notFound();

  const canManage = role === "owner" || role === "manager";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/suppliers/${supplier.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to supplier
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Edit supplier</CardTitle>
            <CardDescription>Update contact and profile details.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {supplier.archivedAt ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This supplier is archived. Restore it before editing.
            </p>
          ) : (
            <SupplierForm
              mode="edit"
              supplier={supplier}
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
