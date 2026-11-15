"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  archiveSupplierAction,
  restoreSupplierAction,
} from "@/lib/suppliers/actions";

type ArchiveSupplierButtonProps = {
  supplierId: string;
  archived: boolean;
};

export function ArchiveSupplierButton({
  supplierId,
  archived,
}: ArchiveSupplierButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = archived
        ? await restoreSupplierAction(supplierId)
        : await archiveSupplierAction(supplierId);
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
      <Button
        type="button"
        variant={archived ? "secondary" : "danger"}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending
          ? "Working…"
          : archived
            ? "Restore supplier"
            : "Archive supplier"}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
