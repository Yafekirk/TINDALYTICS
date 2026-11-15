import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreditForm } from "@/components/credits/credit-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentStoreContext } from "@/lib/auth/session";
import {
  listCreditCustomerOptions,
  listLinkableSalesForCustomer,
} from "@/lib/services/credits";
import { addManilaDays, manilaDayKey, startOfManilaDay } from "@/lib/utils/timezone";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Create credit" };

type PageProps = {
  searchParams: Promise<{ customerId?: string }>;
};

export default async function NewCreditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const customers = await listCreditCustomerOptions(store.id);
  const defaultCustomerId =
    params.customerId && customers.some((c) => c.id === params.customerId)
      ? params.customerId
      : customers[0]?.id;
  const initialSales = defaultCustomerId
    ? await listLinkableSalesForCustomer(store.id, defaultCustomerId)
    : [];
  const defaultDueDate = manilaDayKey(addManilaDays(startOfManilaDay(), 7));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/credits"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to credits
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Create credit / utang</CardTitle>
            <CardDescription>
              Record a customer balance with an optional due date and linked
              sale.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CreditForm
            customers={customers}
            defaultCustomerId={defaultCustomerId}
            initialSales={initialSales}
            defaultDueDate={defaultDueDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
