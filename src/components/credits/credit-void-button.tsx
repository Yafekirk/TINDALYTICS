"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { voidCreditAction, type CreditActionState } from "@/lib/credits/actions";

type CreditVoidButtonProps = {
  creditId: string;
};

export function CreditVoidButton({ creditId }: CreditVoidButtonProps) {
  const [state, setState] = useState<CreditActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleVoid() {
    const reason = window.prompt(
      "Optional reason for voiding this credit:",
      "",
    );
    if (reason === null) return;

    const formData = new FormData();
    if (reason.trim()) formData.set("reason", reason.trim());

    startTransition(async () => {
      const result = await voidCreditAction(creditId, formData);
      setState(result);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleVoid}
        disabled={isPending}
      >
        {isPending ? "Voiding…" : "Void credit"}
      </Button>
      {state.error ? (
        <p className="text-xs text-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-primary">{state.success}</p>
      ) : null}
    </div>
  );
}
