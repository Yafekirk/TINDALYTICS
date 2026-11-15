"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSupplierAction,
  updateSupplierAction,
  type SupplierActionState,
} from "@/lib/suppliers/actions";
import type { SupplierDetail } from "@/types/supplier";

type SupplierFormProps = {
  mode: "create" | "edit";
  supplier?: SupplierDetail;
  canManage: boolean;
};

export function SupplierForm({ mode, supplier, canManage }: SupplierFormProps) {
  const [state, setState] = useState<SupplierActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (!canManage) return;
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSupplierAction({}, formData)
          : await updateSupplierAction(supplier!.id, {}, formData);
      setState(result);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Supplier name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={supplier?.name ?? ""}
            disabled={!canManage || isPending}
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact person</Label>
          <Input
            id="contactPerson"
            name="contactPerson"
            defaultValue={supplier?.contactPerson ?? ""}
            disabled={!canManage || isPending}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={supplier?.phone ?? ""}
            disabled={!canManage || isPending}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier?.email ?? ""}
            disabled={!canManage || isPending}
          />
          {state.fieldErrors?.email ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={supplier?.address ?? ""}
            disabled={!canManage || isPending}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={supplier?.notes ?? ""}
            disabled={!canManage || isPending}
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
        {canManage ? (
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create supplier"
                : "Save changes"}
          </Button>
        ) : null}
        <Link
          href={supplier ? `/suppliers/${supplier.id}` : "/suppliers"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
