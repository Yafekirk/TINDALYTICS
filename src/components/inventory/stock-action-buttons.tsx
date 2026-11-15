"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import type { InventoryRow, ManualMovementType } from "@/types/inventory";

type StockActionButtonsProps = {
  item: InventoryRow;
};

export function StockActionButtons({ item }: StockActionButtonsProps) {
  const [mode, setMode] = useState<ManualMovementType | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="soft"
          onClick={() => setMode("stock_in")}
        >
          In
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setMode("stock_out")}
        >
          Out
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setMode("adjustment")}
        >
          Adjust
        </Button>
      </div>

      {mode ? (
        <StockMovementDialog
          item={item}
          mode={mode}
          onClose={() => setMode(null)}
        />
      ) : null}
    </>
  );
}
