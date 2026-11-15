import { z } from "zod";

export const purchaseOrderLineSchema = z.object({
  productId: z.uuid("Select a product"),
  quantity: z.number().finite().gt(0, "Quantity must be greater than 0").max(999999),
  unitCost: z.number().finite().min(0, "Unit cost cannot be negative").max(9999999),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.uuid("Select a supplier"),
  orderDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid order date"),
  expectedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid expected date")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  items: z
    .array(purchaseOrderLineSchema)
    .min(1, "Add at least one product")
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.productId)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "productId"],
            message: "Duplicate product in this order",
          });
        }
        seen.add(item.productId);
      });
    }),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const receivePurchaseOrderSchema = z.object({
  purchaseOrderId: z.uuid(),
  items: z
    .array(
      z.object({
        itemId: z.uuid(),
        quantity: z.number().finite().gt(0).max(999999),
      }),
    )
    .min(1, "Select at least one item to receive"),
});

export type ReceivePurchaseOrderInput = z.infer<
  typeof receivePurchaseOrderSchema
>;
