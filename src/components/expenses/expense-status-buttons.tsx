"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  archiveExpenseAction,
  restoreExpenseAction,
  voidExpenseAction,
} from "@/lib/expenses/actions";
import type { ExpenseStatus } from "@/types/expense";

type ExpenseStatusButtonsProps = {
  expenseId: string;
  status: ExpenseStatus;
};

export function ExpenseStatusButtons({
  expenseId,
  status,
}: ExpenseStatusButtonsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: "void" | "archive" | "restore") {
    startTransition(async () => {
      const result =
        action === "void"
          ? await voidExpenseAction(expenseId)
          : action === "archive"
            ? await archiveExpenseAction(expenseId)
            : await restoreExpenseAction(expenseId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "active" ? (
          <>
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() => run("void")}
            >
              Void
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => run("archive")}
            >
              Archive
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => run("restore")}
          >
            Restore to active
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
