import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required").max(120),
  contactNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  address: z
    .string()
    .trim()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export function parseCustomerFormData(formData: FormData) {
  return customerSchema.safeParse({
    name: String(formData.get("name") || ""),
    contactNumber: String(formData.get("contactNumber") || "") || null,
    address: String(formData.get("address") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  });
}
