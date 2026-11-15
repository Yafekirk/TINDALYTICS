import Link from "next/link";
import { Eye } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import type { CustomerListItem } from "@/types/customer";

type CustomersTableProps = {
  items: CustomerListItem[];
};

export function CustomersTable({ items }: CustomersTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No customers yet"
        description="Customer profiles are optional for cash sales, but useful for utang tracking."
        action={
          <Link
            href="/customers/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Add customer
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Customer</TH>
          <TH>Contact</TH>
          <TH>Purchases</TH>
          <TH>Total spent</TH>
          <TH>Outstanding</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((customer) => (
          <TR key={customer.id}>
            <TD>
              <Link
                href={`/customers/${customer.id}`}
                className="font-medium text-navy hover:text-primary hover:underline"
              >
                {customer.name}
              </Link>
              {customer.address ? (
                <p className="mt-0.5 text-xs text-secondary line-clamp-1">
                  {customer.address}
                </p>
              ) : null}
            </TD>
            <TD>{customer.contactNumber ?? "—"}</TD>
            <TD>{customer.purchaseCount}</TD>
            <TD>{formatCurrency(customer.totalSpent)}</TD>
            <TD
              className={
                customer.outstandingBalance > 0
                  ? "font-medium text-amber-800"
                  : "text-secondary"
              }
            >
              {formatCurrency(customer.outstandingBalance)}
            </TD>
            <TD>
              <div className="flex justify-end">
                <Link
                  href={`/customers/${customer.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`View ${customer.name}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
