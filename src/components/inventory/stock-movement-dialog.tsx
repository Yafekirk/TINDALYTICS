"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adjustStockAction,
  stockInAction,
  stockOutAction,
  type InventoryActionState,
} from "@/lib/inventory/actions";
import type { InventoryRow, ManualMovementType } from "@/types/inventory";

type StockMovementDialogProps = {
  item: InventoryRow;
  mode: ManualMovementType;
  onClose: () => void;
};

const titles: Record<ManualMovementType, string> = {
  stock_in: "Stock in",
  stock_out: "Stock out",
  adjustment: "Adjust stock",
};

export function StockMovementDialog({
  item,
  mode,
  onClose,
}: StockMovementDialogProps) {
  const router = useRouter();
  const [state, setState] = useState<InventoryActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("productId", item.productId);

    startTransition(async () => {
      const action =
        mode === "stock_in"
          ? stockInAction
          : mode === "stock_out"
            ? stockOutAction
            : adjustStockAction;

      const result = await action({}, formData);
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
        className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-xl"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-navy">{titles[mode]}</h3>
          <p className="mt-1 text-sm text-secondary">
            {item.name} · Current: {item.quantity} {item.unit}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {mode === "adjustment" ? (
            <div>
              <Label htmlFor="newQuantity">New quantity</Label>
              <Input
                id="newQuantity"
                name="newQuantity"
                type="number"
                min="0"
                step="1"
                defaultValue={item.quantity}
                required
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                defaultValue={1}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">
              Notes{mode === "adjustment" ? " (required)" : " (optional)"}
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={
                mode === "adjustment"
                  ? "Reason for adjustment"
                  : "Supplier delivery, spoilage, etc."
              }
              required={mode === "adjustment"}
            />
          </div>

          {state.error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
