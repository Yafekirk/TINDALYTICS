import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/types/expense";

export const expenseSchema = z.object({
  name: z.string().trim().min(2, "Expense name is required").max(120),
  category: z.enum(EXPENSE_CATEGORIES, {
    message: "Select an expense category",
  }),
  amount: z.number().finite().gt(0, "Amount must be greater than 0").max(9999999),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid expense date"),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  paymentMethod: z.enum(["cash", "gcash", "other"], {
    message: "Select a payment method",
  }),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export function parseExpenseFormData(formData: FormData) {
  return expenseSchema.safeParse({
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || ""),
    amount: Number(formData.get("amount")),
    expenseDate: String(formData.get("expenseDate") || ""),
    description: String(formData.get("description") || "") || null,
    paymentMethod: String(formData.get("paymentMethod") || "cash"),
  });
}

export function expenseCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    electricity: "Electricity",
    water: "Water",
    rent: "Rent",
    transportation: "Transportation",
    supplies: "Supplies",
    miscellaneous: "Miscellaneous",
  };
  return labels[category] ?? category;
}
