import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCreditPayment,
  applyInventoryDelta,
  calculateCashChange,
  calculateSaleTotals,
  roundMoney,
} from "./money.ts";

describe("roundMoney", () => {
  it("rounds to two decimal places", () => {
    assert.equal(roundMoney(10.005), 10.01);
    assert.equal(roundMoney(1.999), 2);
  });
});

describe("calculateSaleTotals", () => {
  it("computes subtotal, discount, and total on the server", () => {
    const result = calculateSaleTotals({
      lines: [
        { quantity: 2, unitPrice: 25 },
        { quantity: 1, unitPrice: 49.5 },
      ],
      discount: 5,
    });
    assert.deepEqual(result, {
      subtotal: 99.5,
      discount: 5,
      total: 94.5,
    });
  });

  it("rejects discount greater than subtotal", () => {
    assert.throws(
      () =>
        calculateSaleTotals({
          lines: [{ quantity: 1, unitPrice: 10 }],
          discount: 11,
        }),
      /Discount cannot exceed subtotal/,
    );
  });
});

describe("calculateCashChange", () => {
  it("returns change for cash payments", () => {
    assert.deepEqual(
      calculateCashChange({ total: 94.5, cashReceived: 100 }),
      { cashReceived: 100, changeAmount: 5.5 },
    );
  });

  it("rejects insufficient cash", () => {
    assert.throws(
      () => calculateCashChange({ total: 50, cashReceived: 40 }),
      /Cash received is less than total/,
    );
  });
});

describe("applyInventoryDelta", () => {
  it("stocks in and out safely", () => {
    assert.deepEqual(
      applyInventoryDelta({
        currentQty: 10,
        movementType: "stock_in",
        quantity: 5,
      }),
      { delta: 5, nextQty: 15 },
    );
    assert.deepEqual(
      applyInventoryDelta({
        currentQty: 10,
        movementType: "stock_out",
        quantity: 4,
      }),
      { delta: -4, nextQty: 6 },
    );
  });

  it("blocks stock-out when inventory is insufficient", () => {
    assert.throws(
      () =>
        applyInventoryDelta({
          currentQty: 2,
          movementType: "stock_out",
          quantity: 3,
        }),
      /Insufficient stock/,
    );
  });

  it("supports absolute adjustments", () => {
    assert.deepEqual(
      applyInventoryDelta({
        currentQty: 8,
        movementType: "adjustment",
        setQuantity: 5,
      }),
      { delta: -3, nextQty: 5 },
    );
  });
});

describe("applyCreditPayment", () => {
  it("records partial and full payments without overpayment", () => {
    assert.deepEqual(applyCreditPayment({ balance: 100, paymentAmount: 40 }), {
      nextBalance: 60,
      status: "partial",
    });
    assert.deepEqual(applyCreditPayment({ balance: 60, paymentAmount: 60 }), {
      nextBalance: 0,
      status: "paid",
    });
  });

  it("prevents overpayment", () => {
    assert.throws(
      () => applyCreditPayment({ balance: 20, paymentAmount: 25 }),
      /Payment exceeds outstanding balance/,
    );
  });
});
