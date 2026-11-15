import type { Metadata } from "next";
import Link from "next/link";
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

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Add supplier" };

export default async function NewSupplierPage() {
  const { store, role } = await getCurrentStoreContext();
  const canManage = role === "owner" || role === "manager";

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to suppliers
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Add supplier</CardTitle>
            <CardDescription>
              Create a supplier profile for purchasing and product sourcing.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!canManage ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-secondary">
              View-only access. Only owners or managers can add suppliers.
            </p>
          ) : (
            <SupplierForm mode="create" canManage={canManage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
