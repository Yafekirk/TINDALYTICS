"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  receivePurchaseOrderAction,
  type PurchaseOrderActionState,
} from "@/lib/purchase-orders/actions";
import type { PurchaseOrderItemDetail } from "@/types/purchase-order";

type PoReceiveDialogProps = {
  purchaseOrderId: string;
  poNumber: string;
  items: PurchaseOrderItemDetail[];
  onClose: () => void;
};

export function PoReceiveDialog({
  purchaseOrderId,
  poNumber,
  items,
  onClose,
}: PoReceiveDialogProps) {
  const router = useRouter();
  const receivable = useMemo(
    () =>
      items
        .map((item) => ({
          ...item,
          remaining: item.quantity - item.receivedQuantity,
        }))
        .filter((item) => item.remaining > 0),
    [items],
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(receivable.map((item) => [item.id, item.remaining])),
  );
  const [state, setState] = useState<PurchaseOrderActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const payload = receivable
      .map((item) => ({
        itemId: item.id,
        quantity: Number(quantities[item.id] ?? 0),
      }))
      .filter((item) => item.quantity > 0);

    const formData = new FormData();
    formData.set("purchaseOrderId", purchaseOrderId);
    formData.set("itemsJson", JSON.stringify(payload));

    startTransition(async () => {
      const result = await receivePurchaseOrderAction({}, formData);
      setState(result);
      if (result.success) {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-navy">Receive goods</h3>
          <p className="mt-1 text-sm text-secondary">
            {poNumber}. Enter quantities received for each remaining line.
          </p>
        </div>

        <div className="space-y-3">
          {receivable.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">{item.productName}</p>
                  <p className="text-xs text-secondary">
                    Remaining {item.remaining} {item.unit}
                  </p>
                </div>
                <div className="w-28">
                  <Label htmlFor={`qty-${item.id}`} className="sr-only">
                    Quantity for {item.productName}
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    max={item.remaining}
                    step="0.01"
                    value={quantities[item.id] ?? 0}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.id]: Number(event.target.value),
                      }))
                    }
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {state.error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Receiving…" : "Confirm receive"}
          </Button>
        </div>
      </div>
    </div>
  );
}
