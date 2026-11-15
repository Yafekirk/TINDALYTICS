import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { getCustomer } from "@/lib/services/customers";

export const metadata: Metadata = { title: "Edit customer" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params;
  const { store } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const customer = await getCustomer(store.id, id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/customers/${customer.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customer
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Edit customer</CardTitle>
            <CardDescription>Update contact details and notes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="edit" customer={customer} />
        </CardContent>
      </Card>
    </div>
  );
}
