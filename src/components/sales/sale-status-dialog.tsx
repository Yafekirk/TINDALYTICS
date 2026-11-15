"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  voidOrRefundSaleAction,
  type SaleActionState,
} from "@/lib/sales/actions";
import type { SaleStatusAction } from "@/types/sales";

type SaleStatusDialogProps = {
  saleId: string;
  receiptNumber: string;
  action: SaleStatusAction;
  onClose: () => void;
};

export function SaleStatusDialog({
  saleId,
  receiptNumber,
  action,
  onClose,
}: SaleStatusDialogProps) {
  const router = useRouter();
  const [state, setState] = useState<SaleActionState>({});
  const [isPending, startTransition] = useTransition();

  const title = action === "void" ? "Void sale" : "Refund sale";
  const description =
    action === "void"
      ? "Voids this completed sale and restores inventory. This cannot be undone."
      : "Marks this sale as refunded and restores inventory. This cannot be undone.";

  function handleSubmit(formData: FormData) {
    formData.set("saleId", saleId);
    formData.set("action", action);

    startTransition(async () => {
      const result = await voidOrRefundSaleAction({}, formData);
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
          <h3 className="text-lg font-semibold text-navy">{title}</h3>
          <p className="mt-1 text-sm text-secondary">
            {receiptNumber}. {description}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              required
              minLength={3}
              placeholder={
                action === "void"
                  ? "e.g. Wrong items scanned / customer cancelled"
                  : "e.g. Customer returned unused items"
              }
              disabled={isPending}
            />
            {state.fieldErrors?.reason ? (
              <p className="mt-1 text-xs text-danger">
                {state.fieldErrors.reason}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
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
            <Button
              type="submit"
              variant={action === "void" ? "danger" : "primary"}
              disabled={isPending}
            >
              {isPending
                ? "Saving…"
                : action === "void"
                  ? "Void sale"
                  : "Refund sale"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
