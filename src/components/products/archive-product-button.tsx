"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  archiveProductAction,
  restoreProductAction,
} from "@/lib/products/actions";

type ArchiveProductButtonProps = {
  productId: string;
  archived: boolean;
};

export function ArchiveProductButton({
  productId,
  archived,
}: ArchiveProductButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = archived
        ? await restoreProductAction(productId)
        : await archiveProductAction(productId);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={archived ? "soft" : "danger"}
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending
          ? "Working…"
          : archived
            ? "Restore product"
            : "Archive product"}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
