import { z } from "zod";
import { CREDIT_STATUSES } from "@/types/credit";

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v ? v : null))
  .pipe(
    z.union([
      z.null(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid due date"),
    ]),
  );

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v ? v : null))
  .pipe(z.union([z.null(), z.string().uuid("Invalid sale reference")]));

export const createCreditSchema = z.object({
  customerId: z.string().uuid("Select a customer"),
  amount: z
    .number()
    .finite()
    .gt(0, "Amount must be greater than 0")
    .max(9999999),
  dueDate: optionalDate,
  saleId: optionalUuid,
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;

export const creditPaymentSchema = z.object({
  amount: z
    .number()
    .finite()
    .gt(0, "Payment amount must be greater than 0")
    .max(9999999),
  paymentMethod: z.enum(["cash", "gcash", "other"], {
    message: "Select a payment method",
  }),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type CreditPaymentInput = z.infer<typeof creditPaymentSchema>;

export function parseCreateCreditFormData(formData: FormData) {
  return createCreditSchema.safeParse({
    customerId: String(formData.get("customerId") || ""),
    amount: Number(formData.get("amount")),
    dueDate: String(formData.get("dueDate") || ""),
    saleId: String(formData.get("saleId") || ""),
    notes: String(formData.get("notes") || "") || null,
  });
}

export function parseCreditPaymentFormData(formData: FormData) {
  return creditPaymentSchema.safeParse({
    amount: Number(formData.get("amount")),
    paymentMethod: String(formData.get("paymentMethod") || "cash"),
    notes: String(formData.get("notes") || "") || null,
  });
}

export function creditStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Open",
    partial: "Partial",
    paid: "Paid",
    voided: "Voided",
    outstanding: "Outstanding",
    overdue: "Overdue",
  };
  return labels[status] ?? status;
}

export function isCreditStatus(
  value: string | null | undefined,
): value is (typeof CREDIT_STATUSES)[number] {
  return CREDIT_STATUSES.includes(value as (typeof CREDIT_STATUSES)[number]);
}

export function paymentMethodLabel(method: string) {
  if (method === "cash") return "Cash";
  if (method === "gcash") return "GCash";
  return "Other";
}
