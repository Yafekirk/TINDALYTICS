import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations/auth";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function parseProfileFormData(formData: FormData) {
  return profileSchema.safeParse({
    fullName: String(formData.get("fullName") || ""),
  });
}

export function parseChangePasswordFormData(formData: FormData) {
  return resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
}
