import { z } from "zod";

export const stockInOutSchema = z.object({
  productId: z.uuid("Select a product"),
  quantity: z.coerce
    .number({ error: "Enter a valid quantity" })
    .finite()
    .gt(0, "Quantity must be greater than zero")
    .max(9999999, "Quantity is too large"),
  notes: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => (value ? value : null)),
});

export const stockAdjustmentSchema = z.object({
  productId: z.uuid("Select a product"),
  newQuantity: z.coerce
    .number({ error: "Enter a valid quantity" })
    .finite()
    .min(0, "Quantity cannot be negative")
    .max(9999999, "Quantity is too large"),
  notes: z
    .string()
    .trim()
    .min(3, "Add a short reason for the adjustment")
    .max(300),
});

export type StockInOutInput = z.infer<typeof stockInOutSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export function parseStockInOutFormData(formData: FormData) {
  return stockInOutSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes") || undefined,
  });
}

export function parseStockAdjustmentFormData(formData: FormData) {
  return stockAdjustmentSchema.safeParse({
    productId: formData.get("productId"),
    newQuantity: formData.get("newQuantity"),
    notes: formData.get("notes"),
  });
}
