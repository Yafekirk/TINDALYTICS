"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createPurchaseOrderAction,
  updateDraftPurchaseOrderAction,
  type PurchaseOrderActionState,
} from "@/lib/purchase-orders/actions";
import { formatCurrency } from "@/lib/utils/currency";
import type {
  ProductOptionForPo,
  PurchaseOrderDetail,
} from "@/types/purchase-order";
import type { SupplierOption } from "@/types/product";

type LineDraft = {
  key: string;
  productId: string;
  quantity: number;
  unitCost: number;
};

type PoFormProps = {
  mode: "create" | "edit";
  suppliers: SupplierOption[];
  products: ProductOptionForPo[];
  purchaseOrder?: PurchaseOrderDetail;
  initialSupplierId?: string;
  defaultOrderDate: string;
  canManage: boolean;
};

function makeKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PoForm({
  mode,
  suppliers,
  products,
  purchaseOrder,
  initialSupplierId,
  defaultOrderDate,
  canManage,
}: PoFormProps) {
  const [state, setState] = useState<PurchaseOrderActionState>({});
  const [isPending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState(
    purchaseOrder?.supplierId ?? initialSupplierId ?? "",
  );
  const [lines, setLines] = useState<LineDraft[]>(
    purchaseOrder?.items.map((item) => ({
      key: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
    })) ?? [{ key: makeKey(), productId: "", quantity: 1, unitCost: 0 }],
  );

  const filteredProducts = useMemo(() => {
    if (!supplierId) return products;
    return products.filter(
      (product) =>
        product.supplierId == null || product.supplierId === supplierId,
    );
  }, [products, supplierId]);

  const total = useMemo(
    () =>
      Math.round(
        lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0) *
          100,
      ) / 100,
    [lines],
  );

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function handleProductChange(key: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateLine(key, {
      productId,
      unitCost: product?.costPrice ?? 0,
    });
  }

  function handleSubmit(submitAs: "draft" | "ordered") {
    if (!canManage) return;
    const formData = new FormData();
    const form = document.getElementById("po-form") as HTMLFormElement | null;
    if (!form) return;

    const native = new FormData(form);
    formData.set("supplierId", String(native.get("supplierId") || ""));
    formData.set("orderDate", String(native.get("orderDate") || ""));
    formData.set("expectedDate", String(native.get("expectedDate") || ""));
    formData.set("notes", String(native.get("notes") || ""));
    formData.set("submitAs", submitAs);
    formData.set(
      "itemsJson",
      JSON.stringify(
        lines
          .filter((line) => line.productId)
          .map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            unitCost: Number(line.unitCost),
          })),
      ),
    );

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPurchaseOrderAction({}, formData)
          : await updateDraftPurchaseOrderAction(
              purchaseOrder!.id,
              {},
              formData,
            );
      setState(result);
    });
  }

  return (
    <form id="po-form" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="supplierId">Supplier</Label>
          <Select
            id="supplierId"
            name="supplierId"
            required
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            disabled={!canManage || isPending}
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="orderDate">Order date</Label>
          <Input
            id="orderDate"
            name="orderDate"
            type="date"
            required
            defaultValue={purchaseOrder?.orderDate ?? defaultOrderDate}
            disabled={!canManage || isPending}
          />
        </div>
        <div>
          <Label htmlFor="expectedDate">Expected date</Label>
          <Input
            id="expectedDate"
            name="expectedDate"
            type="date"
            defaultValue={purchaseOrder?.expectedDate ?? ""}
            disabled={!canManage || isPending}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={purchaseOrder?.notes ?? ""}
            disabled={!canManage || isPending}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">Order items</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canManage || isPending}
            onClick={() =>
              setLines((current) => [
                ...current,
                { key: makeKey(), productId: "", quantity: 1, unitCost: 0 },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => {
            const product = products.find((item) => item.id === line.productId);
            return (
              <div
                key={line.key}
                className="grid gap-3 rounded-2xl border border-border p-3 md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  <Label>Product</Label>
                  <Select
                    value={line.productId}
                    onChange={(event) =>
                      handleProductChange(line.key, event.target.value)
                    }
                    disabled={!canManage || isPending}
                  >
                    <option value="">Select product</option>
                    {filteredProducts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Qty {product ? `(${product.unit})` : ""}</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, {
                        quantity: Number(event.target.value),
                      })
                    }
                    disabled={!canManage || isPending}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Unit cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(event) =>
                      updateLine(line.key, {
                        unitCost: Number(event.target.value),
                      })
                    }
                    disabled={!canManage || isPending}
                  />
                </div>
                <div className="flex items-end justify-between gap-2 md:col-span-3">
                  <div>
                    <p className="text-xs text-secondary">Line total</p>
                    <p className="font-medium text-navy">
                      {formatCurrency(line.quantity * line.unitCost)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canManage || isPending || lines.length === 1}
                    onClick={() =>
                      setLines((current) =>
                        current.filter((item) => item.key !== line.key),
                      )
                    }
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-secondary">
            Order total:{" "}
            <span className="text-lg font-semibold text-navy">
              {formatCurrency(total)}
            </span>
          </p>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleSubmit("draft")}
            >
              {isPending ? "Saving…" : mode === "create" ? "Save draft" : "Update draft"}
            </Button>
            {mode === "create" ? (
              <Button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit("ordered")}
              >
                Save & mark ordered
              </Button>
            ) : null}
          </>
        ) : null}
        <Link
          href={
            purchaseOrder
              ? `/purchase-orders/${purchaseOrder.id}`
              : "/purchase-orders"
          }
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
