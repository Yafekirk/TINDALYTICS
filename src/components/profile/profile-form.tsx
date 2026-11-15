"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileDetails } from "@/types/account";

const initialState: ProfileActionState = {};

type ProfileFormProps = {
  profile: ProfileDetails;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          defaultValue={profile.fullName}
          disabled={pending}
        />
        {state.fieldErrors?.fullName ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.fullName}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={profile.email ?? ""}
          disabled
          readOnly
        />
        <p className="mt-1 text-xs text-secondary">
          Email is managed by your sign-in account.
        </p>
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

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
