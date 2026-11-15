import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { ArchiveSupplierButton } from "@/components/suppliers/archive-supplier-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/format";
import type { SupplierDetail } from "@/types/supplier";

type SupplierDetailViewProps = {
  supplier: SupplierDetail;
  canManage: boolean;
};

export function SupplierDetailView({
  supplier,
  canManage,
}: SupplierDetailViewProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/suppliers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to suppliers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-navy">{supplier.name}</h2>
            <Badge tone={supplier.archivedAt ? "warning" : "success"}>
              {supplier.archivedAt ? "Archived" : "Active"}
            </Badge>
          </div>
          <p className="text-sm text-secondary">
            {supplier.contactPerson ?? "No contact person"}
            {supplier.phone ? ` · ${supplier.phone}` : ""}
            {supplier.email ? ` · ${supplier.email}` : ""}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {!supplier.archivedAt ? (
              <Link
                href={`/suppliers/${supplier.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            ) : null}
            <ArchiveSupplierButton
              supplierId={supplier.id}
              archived={Boolean(supplier.archivedAt)}
            />
            <Link
              href={`/purchase-orders/new?supplier=${supplier.id}`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              New PO
            </Link>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Contact details</CardTitle>
              <CardDescription>Supplier profile information.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-secondary">Address: </span>
              <span className="text-navy">{supplier.address ?? "—"}</span>
            </p>
            <p>
              <span className="text-secondary">Notes: </span>
              <span className="text-navy whitespace-pre-wrap">
                {supplier.notes ?? "—"}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Linked products</CardTitle>
              <CardDescription>
                Products assigned to this supplier.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {supplier.products.length === 0 ? (
              <EmptyState
                title="No linked products"
                description="Assign this supplier when creating or editing products."
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH>Stock</TH>
                    <TH>Cost</TH>
                    <TH>Sell</TH>
                  </TR>
                </THead>
                <TBody>
                  {supplier.products.map((product) => (
                    <TR key={product.id}>
                      <TD>
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium text-navy hover:text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-secondary">{product.sku}</p>
                      </TD>
                      <TD>
                        {product.stock} {product.unit}
                      </TD>
                      <TD>{formatCurrency(product.costPrice)}</TD>
                      <TD>{formatCurrency(product.sellingPrice)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Purchase order history</CardTitle>
            <CardDescription>
              Orders placed with this supplier.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {supplier.purchaseOrders.length === 0 ? (
            <EmptyState
              title="No purchase orders yet"
              description="Create a PO to start ordering from this supplier."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>PO #</TH>
                  <TH>Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {supplier.purchaseOrders.map((po) => (
                  <TR key={po.id}>
                    <TD>
                      <Link
                        href={`/purchase-orders/${po.id}`}
                        className="font-medium text-navy hover:text-primary hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    </TD>
                    <TD>{formatDate(po.orderDate)}</TD>
                    <TD className="capitalize">
                      {po.status.replaceAll("_", " ")}
                    </TD>
                    <TD className="text-right font-medium text-navy">
                      {formatCurrency(po.totalAmount)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
