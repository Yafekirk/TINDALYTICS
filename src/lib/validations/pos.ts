import { z } from "zod";

export const checkoutSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.uuid(),
          quantity: z.number().finite().gt(0).max(99999),
        }),
      )
      .min(1, "Add at least one product to the cart"),
    paymentMethod: z.enum(["cash", "gcash", "other"]),
    cashReceived: z.number().finite().min(0).optional(),
    discount: z.number().finite().min(0).max(9999999).optional().default(0),
    customerId: z.uuid().nullable().optional(),
    notes: z.string().trim().max(300).nullable().optional(),
    idempotencyKey: z.string().trim().min(8, "Missing checkout key"),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "cash") {
      if (data.cashReceived == null) {
        ctx.addIssue({
          code: "custom",
          path: ["cashReceived"],
          message: "Enter cash received",
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
