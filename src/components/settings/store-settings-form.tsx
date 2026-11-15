"use client";

import { useActionState } from "react";
import {
  updateStoreSettingsAction,
  type SettingsActionState,
} from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoreSettings } from "@/types/account";

const initialState: SettingsActionState = {};

type StoreSettingsFormProps = {
  store: StoreSettings;
};

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateStoreSettingsAction,
    initialState,
  );
  const disabled = pending || !store.canEdit;

  return (
    <form action={formAction} className="space-y-4">
      {!store.canEdit ? (
        <p className="rounded-xl bg-accent-soft/60 px-3 py-2 text-sm text-navy">
          Only the store owner can edit these settings. You can view them as{" "}
          {store.role ?? "a member"}.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Store name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={store.name}
            disabled={disabled}
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={store.address ?? ""}
            placeholder="Street, barangay, city"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={store.phone ?? ""}
            placeholder="09xxxxxxxxx"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={store.currency}
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={store.timezone}
            disabled={disabled}
          />
          <p className="mt-1 text-xs text-secondary">
            Reports and dashboard dates use this timezone (default Asia/Manila).
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

      {store.canEdit ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save store settings"}
        </Button>
      ) : null}
    </form>
  );
}
