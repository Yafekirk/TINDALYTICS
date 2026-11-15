import { z } from "zod";

export const PRODUCT_UNITS = [
  "pc",
  "pack",
  "bottle",
  "can",
  "sachet",
  "box",
  "kg",
  "g",
  "L",
  "ml",
] as const;

const moneySchema = z.coerce
  .number({ error: "Enter a valid amount" })
  .finite("Enter a valid amount")
  .min(0, "Price cannot be negative")
  .max(9999999.99, "Price is too large");

const optionalUuid = z.preprocess(
  (value) => {
    if (value == null || value === "" || value === "none") return null;
    return value;
  },
  z.union([z.uuid("Invalid selection"), z.null()]),
);

const optionalText = z.preprocess(
  (value) => {
    if (value == null || value === "") return null;
    return value;
  },
  z.union([z.string().trim().max(500), z.null()]),
);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required").max(120),
    sku: z
      .string()
      .trim()
      .min(2, "SKU is required")
      .max(60)
      .regex(/^[A-Za-z0-9-_]+$/, "SKU can only use letters, numbers, - and _"),
    barcode: z.preprocess(
      (value) => {
        if (value == null || value === "") return null;
        return value;
      },
      z.union([z.string().trim().max(64), z.null()]),
    ),
    categoryId: optionalUuid,
    newCategoryName: z.preprocess(
      (value) => {
        if (value == null || value === "") return null;
        return value;
      },
      z.union([z.string().trim().max(80), z.null()]),
    ),
    description: optionalText,
    costPrice: moneySchema,
    sellingPrice: moneySchema,
    unit: z.enum(PRODUCT_UNITS, { error: "Select a unit" }),
    supplierId: optionalUuid,
    minStockLevel: z.coerce
      .number({ error: "Enter a valid stock level" })
      .finite()
      .min(0, "Minimum stock cannot be negative")
      .max(9999999, "Minimum stock is too large"),
    isActive: z.coerce.boolean().default(true),
    initialStock: z.coerce
      .number({ error: "Enter a valid quantity" })
      .finite()
      .min(0, "Initial stock cannot be negative")
      .max(9999999)
      .optional()
      .default(0),
  })
  .refine((data) => data.sellingPrice >= data.costPrice, {
    message: "Selling price should be at least the cost price",
    path: ["sellingPrice"],
  })
  .refine((data) => Boolean(data.categoryId || data.newCategoryName), {
    message: "Select a category or create a new one",
    path: ["categoryId"],
  });

export const productUpdateSchema = productSchema;

export type ProductInput = z.infer<typeof productSchema>;

export function parseProductFormData(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    newCategoryName: formData.get("newCategoryName") || undefined,
    description: formData.get("description") || undefined,
    costPrice: formData.get("costPrice"),
    sellingPrice: formData.get("sellingPrice"),
    unit: formData.get("unit"),
    supplierId: formData.get("supplierId") || undefined,
    minStockLevel: formData.get("minStockLevel"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    initialStock: formData.get("initialStock") ?? 0,
  });
}
