import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2, "Store name is required").max(120),
  address: z
    .string()
    .trim()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  timezone: z.string().trim().min(1).max(64).default("Asia/Manila"),
  currency: z.string().trim().min(3).max(8).default("PHP"),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export function parseStoreSettingsFormData(formData: FormData) {
  return storeSettingsSchema.safeParse({
    name: String(formData.get("name") || ""),
    address: String(formData.get("address") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    timezone: String(formData.get("timezone") || "Asia/Manila"),
    currency: String(formData.get("currency") || "PHP"),
  });
}
