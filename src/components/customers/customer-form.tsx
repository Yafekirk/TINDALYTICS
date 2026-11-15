"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerActionState,
} from "@/lib/customers/actions";
import type { CustomerDetail } from "@/types/customer";

type CustomerFormProps = {
  mode: "create" | "edit";
  customer?: CustomerDetail;
};

export function CustomerForm({ mode, customer }: CustomerFormProps) {
  const [state, setState] = useState<CustomerActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCustomerAction({}, formData)
          : await updateCustomerAction(customer!.id, {}, formData);
      setState(result);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Customer name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={customer?.name ?? ""}
            disabled={isPending}
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="contactNumber">Contact number</Label>
          <Input
            id="contactNumber"
            name="contactNumber"
            defaultValue={customer?.contactNumber ?? ""}
            disabled={isPending}
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={customer?.address ?? ""}
            disabled={isPending}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={customer?.notes ?? ""}
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create customer"
              : "Save changes"}
        </Button>
        <Link
          href={customer ? `/customers/${customer.id}` : "/customers"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
