"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  recordCreditPaymentAction,
  type CreditActionState,
} from "@/lib/credits/actions";
import { formatCurrency } from "@/lib/utils/currency";

type CreditPaymentFormProps = {
  creditId: string;
  balance: number;
};

export function CreditPaymentForm({
  creditId,
  balance,
}: CreditPaymentFormProps) {
  const [state, setState] = useState<CreditActionState>({});
  const [amount, setAmount] = useState(String(balance));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await recordCreditPaymentAction(creditId, {}, formData);
      setState(result);
      if (result.success && !result.error) {
        // Keep amount in sync if partial payment left a remainder —
        // page revalidation will refresh balance; reset for UX.
        setAmount("");
      }
    });
  }

  function payFull() {
    setAmount(String(balance));
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-secondary">
        Outstanding balance:{" "}
        <span className="font-semibold text-navy">
          {formatCurrency(balance)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Label htmlFor="amount">Payment amount (₱)</Label>
            <button
              type="button"
              onClick={payFull}
              className="text-xs font-medium text-primary hover:underline"
            >
              Pay full
            </button>
          </div>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            max={balance}
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={isPending}
          />
          {state.fieldErrors?.amount ? (
            <p className="mt-1 text-xs text-danger">
              {state.fieldErrors.amount}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment method</Label>
          <Select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue="cash"
            disabled={isPending}
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Optional payment note"
            disabled={isPending}
          />
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

      <Button type="submit" disabled={isPending || balance <= 0}>
        {isPending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
