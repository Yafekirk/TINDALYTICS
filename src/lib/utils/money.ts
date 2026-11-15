/** Round monetary values to 2 decimal places (PHP centavos). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type CartLine = {
  quantity: number;
  unitPrice: number;
};

/** Server-side sale totals. Never trust client-calculated totals. */
export function calculateSaleTotals(params: {
  lines: CartLine[];
  discount?: number;
}) {
  const subtotal = roundMoney(
    params.lines.reduce(
      (sum, line) => sum + roundMoney(line.quantity * line.unitPrice),
      0,
    ),
  );
  const discount = roundMoney(Math.max(0, params.discount ?? 0));
  if (discount > subtotal) {
    throw new Error("Discount cannot exceed subtotal");
  }
  const total = roundMoney(subtotal - discount);
  return { subtotal, discount, total };
}

export function calculateCashChange(params: {
  total: number;
  cashReceived: number;
}) {
  const total = roundMoney(params.total);
  const cashReceived = roundMoney(params.cashReceived);
  if (cashReceived < total) {
    throw new Error("Cash received is less than total");
  }
  return {
    cashReceived,
    changeAmount: roundMoney(cashReceived - total),
  };
}

export function applyInventoryDelta(params: {
  currentQty: number;
  movementType: "stock_in" | "stock_out" | "adjustment";
  quantity?: number;
  setQuantity?: number;
}) {
  const current = roundMoney(params.currentQty);

  if (params.movementType === "stock_in") {
    const qty = params.quantity ?? 0;
    if (qty <= 0) throw new Error("Stock-in quantity must be greater than zero");
    return { delta: qty, nextQty: roundMoney(current + qty) };
  }

  if (params.movementType === "stock_out") {
    const qty = params.quantity ?? 0;
    if (qty <= 0) throw new Error("Stock-out quantity must be greater than zero");
    if (current < qty) throw new Error("Insufficient stock for stock-out");
    return { delta: -qty, nextQty: roundMoney(current - qty) };
  }

  const nextQty = params.setQuantity;
  if (nextQty == null || nextQty < 0) {
    throw new Error("Adjusted quantity cannot be negative");
  }
  const delta = roundMoney(nextQty - current);
  if (delta === 0) throw new Error("No stock change to record");
  return { delta, nextQty: roundMoney(nextQty) };
}

export function applyCreditPayment(params: {
  balance: number;
  paymentAmount: number;
}) {
  const balance = roundMoney(params.balance);
  const paymentAmount = roundMoney(params.paymentAmount);

  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  if (paymentAmount > balance) {
    throw new Error("Payment exceeds outstanding balance");
  }

  const nextBalance = roundMoney(balance - paymentAmount);
  return {
    nextBalance,
    status: nextBalance === 0 ? ("paid" as const) : ("partial" as const),
  };
}
