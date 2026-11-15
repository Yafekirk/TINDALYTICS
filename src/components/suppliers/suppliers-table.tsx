import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { SupplierListItem } from "@/types/supplier";

type SuppliersTableProps = {
  items: SupplierListItem[];
};

export function SuppliersTable({ items }: SuppliersTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No suppliers yet"
        description="Add supplier profiles to track purchase orders and product sources."
        action={
          <Link
            href="/suppliers/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Add supplier
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Supplier</TH>
          <TH>Contact</TH>
          <TH>Products</TH>
          <TH>POs</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((supplier) => (
          <TR key={supplier.id}>
            <TD>
              <Link
                href={`/suppliers/${supplier.id}`}
                className="font-medium text-navy hover:text-primary hover:underline"
              >
                {supplier.name}
              </Link>
              {supplier.address ? (
                <p className="mt-0.5 text-xs text-secondary line-clamp-1">
                  {supplier.address}
                </p>
              ) : null}
            </TD>
            <TD>
              <p className="text-navy">
                {supplier.contactPerson ?? "—"}
              </p>
              <p className="text-xs text-secondary">
                {supplier.phone ?? supplier.email ?? "No contact info"}
              </p>
            </TD>
            <TD>{supplier.productCount}</TD>
            <TD>{supplier.purchaseOrderCount}</TD>
            <TD>
              <Badge tone={supplier.archivedAt ? "warning" : "success"}>
                {supplier.archivedAt ? "Archived" : "Active"}
              </Badge>
            </TD>
            <TD>
              <div className="flex justify-end">
                <Link
                  href={`/suppliers/${supplier.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`View ${supplier.name}`}
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
