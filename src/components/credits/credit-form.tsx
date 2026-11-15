"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCreditAction,
  getLinkableSalesAction,
  type CreditActionState,
} from "@/lib/credits/actions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/format";
import type {
  CreditCustomerOption,
  CreditSaleOption,
} from "@/types/credit";

type CreditFormProps = {
  customers: CreditCustomerOption[];
  defaultCustomerId?: string;
  initialSales?: CreditSaleOption[];
  defaultDueDate?: string;
};

export function CreditForm({
  customers,
  defaultCustomerId,
  initialSales = [],
  defaultDueDate,
}: CreditFormProps) {
  const [state, setState] = useState<CreditActionState>({});
  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [sales, setSales] = useState<CreditSaleOption[]>(initialSales);
  const [loadingSales, setLoadingSales] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCustomerChange(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    if (!nextCustomerId) {
      setSales([]);
      return;
    }
    setLoadingSales(true);
    startTransition(async () => {
      const options = await getLinkableSalesAction(nextCustomerId);
      setSales(options);
      setLoadingSales(false);
    });
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCreditAction({}, formData);
      setState(result);
    });
  }

  if (customers.length === 0) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Add a customer first before creating utang records.
        </p>
        <Link
          href="/customers/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          Add customer
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="customerId">Customer</Label>
          <Select
            id="customerId"
            name="customerId"
            required
            value={customerId}
            onChange={(event) => handleCustomerChange(event.target.value)}
            disabled={isPending}
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.outstandingBalance > 0
                  ? ` · outstanding ${formatCurrency(customer.outstandingBalance)}`
                  : ""}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.customerId ? (
            <p className="mt-1 text-xs text-danger">
              {state.fieldErrors.customerId}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="amount">Utang amount (₱)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            disabled={isPending}
          />
          {state.fieldErrors?.amount ? (
            <p className="mt-1 text-xs text-danger">
              {state.fieldErrors.amount}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultDueDate}
            disabled={isPending}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="saleId">Link to sale (optional)</Label>
          <Select
            id="saleId"
            name="saleId"
            defaultValue=""
            disabled={isPending || loadingSales}
          >
            <option value="">No linked sale</option>
            {sales.map((sale) => (
              <option key={sale.id} value={sale.id}>
                {sale.receiptNumber} · {formatCurrency(sale.total)} ·{" "}
                {formatDateTime(sale.createdAt)}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-secondary">
            {loadingSales
              ? "Loading customer sales…"
              : "Optional. Only completed sales without an existing credit are listed."}
          </p>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="e.g. Weekly grocery utang"
            disabled={isPending}
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Create credit"}
        </Button>
        <Link
          href="/credits"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
