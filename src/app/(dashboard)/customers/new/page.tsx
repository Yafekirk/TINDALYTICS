import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";
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

export const metadata: Metadata = { title: "Add customer" };

export default async function NewCustomerPage() {
  const { store } = await getCurrentStoreContext();

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
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Add customer</CardTitle>
            <CardDescription>
              Customer info is optional for walk-in cash sales.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
