"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { checkoutAction } from "@/lib/pos/actions";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { CartLine, PaymentMethod, PosProduct } from "@/types/pos";

type PosTerminalProps = {
  products: PosProduct[];
  categories: { id: string; name: string }[];
  canDiscount: boolean;
  cashierName: string;
};

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pos-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PosTerminal({
  products,
  categories,
  canDiscount,
  cashierName,
}: PosTerminalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [discount, setDiscount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      );
    });
  }, [products, query, categoryId]);

  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);
  const cashValue = Number(cashReceived) || 0;
  const change =
    paymentMethod === "cash" ? Math.max(0, cashValue - total) : 0;

  function addToCart(product: PosProduct) {
    if (product.stock <= 0) return;
    setError(null);
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          quantity: 1,
          stock: product.stock,
          imageUrl: product.imageUrl,
        },
      ];
    });
  }

  function updateQty(productId: string, nextQty: number) {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.productId !== productId) return line;
          const quantity = Math.min(line.stock, Math.max(0, nextQty));
          return { ...line, quantity };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  function clearCart() {
    setCart([]);
    setDiscount("0");
    setCashReceived("");
    setError(null);
    setIdempotencyKey(createIdempotencyKey());
  }

  function handleCheckout() {
    setError(null);

    if (cart.length === 0) {
      setError("Add products to the cart before checkout.");
      return;
    }

    if (discountValue > 0 && !canDiscount) {
      setError("Only owners or managers can apply discounts.");
      return;
    }

    if (discountValue > subtotal) {
      setError("Discount cannot exceed subtotal.");
      return;
    }

    if (paymentMethod === "cash" && cashValue < total) {
      setError("Cash received must cover the total.");
      return;
    }

    startTransition(async () => {
      const result = await checkoutAction({
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
        paymentMethod,
        cashReceived: paymentMethod === "cash" ? cashValue : undefined,
        discount: canDiscount ? discountValue : 0,
        idempotencyKey,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      clearCart();
      router.push(`/pos/receipt/${result.data.saleId}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products by name or SKU…"
                className="pl-9"
              />
            </div>
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="sm:w-56"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6">
            <EmptyState
              title="No products available"
              description="Add active products with stock to start selling."
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={outOfStock || isPending}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "rounded-2xl border border-border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-page">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-semibold text-secondary">
                        {product.sku}
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-navy">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {product.categoryName ?? "Uncategorized"}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                    <Badge tone={outOfStock ? "danger" : "success"}>
                      {outOfStock ? "Out" : `${product.stock} ${product.unit}`}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Cart
              </h3>
              <p className="mt-1 text-xs text-secondary">Cashier: {cashierName}</p>
            </div>
            {cart.length > 0 ? (
              <Button type="button" size="sm" variant="ghost" onClick={clearCart}>
                Clear
              </Button>
            ) : null}
          </div>

          {cart.length === 0 ? (
            <EmptyState
              title="Cart is empty"
              description="Tap products on the left to add them."
            />
          ) : (
            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {cart.map((line) => (
                <li
                  key={line.productId}
                  className="rounded-xl border border-border px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {line.name}
                      </p>
                      <p className="text-xs text-secondary">
                        {formatCurrency(line.unitPrice)} / {line.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-secondary hover:text-danger"
                      onClick={() => updateQty(line.productId, 0)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-border p-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(line.productId, line.quantity - 1)
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-8 text-center text-sm font-semibold text-navy">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(line.productId, line.quantity + 1)
                        }
                        disabled={line.quantity >= line.stock}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-sm font-semibold text-navy">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <Label htmlFor="paymentMethod">Payment method</Label>
              <Select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="discount">
                Discount (₱){canDiscount ? "" : " — managers only"}
              </Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                disabled={!canDiscount || isPending}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </div>

            {paymentMethod === "cash" ? (
              <div>
                <Label htmlFor="cashReceived">Cash received (₱)</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  disabled={isPending}
                  onChange={(event) => setCashReceived(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5 rounded-xl bg-page px-3 py-3 text-sm">
            <div className="flex justify-between text-secondary">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Discount</span>
              <span>-{formatCurrency(discountValue)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-navy">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {paymentMethod === "cash" ? (
              <div className="flex justify-between text-secondary">
                <span>Change</span>
                <span>{formatCurrency(change)}</span>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isPending || cart.length === 0}
            onClick={handleCheckout}
          >
            {isPending ? "Processing…" : "Complete checkout"}
          </Button>
        </div>
      </section>
    </div>
  );
}
