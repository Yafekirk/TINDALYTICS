import { z } from "zod";

export const saleStatusActionSchema = z.object({
  saleId: z.uuid("Invalid sale"),
  action: z.enum(["void", "refund"]),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(300, "Reason is too long"),
});

export type SaleStatusActionInput = z.infer<typeof saleStatusActionSchema>;

export function parseSaleStatusFormData(formData: FormData) {
  return saleStatusActionSchema.safeParse({
    saleId: String(formData.get("saleId") || ""),
    action: String(formData.get("action") || ""),
    reason: String(formData.get("reason") || ""),
  });
}
