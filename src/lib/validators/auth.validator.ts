import { z } from "zod";

export const passwordSchema = z
  .string({ error: "Password is required" })
  .min(6, "Password must be at least 6 characters long")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter (A-Z)",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain at least one lowercase letter (a-z)",
  });

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Please provide a valid email address"),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string({ error: "Full name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name cannot exceed 80 characters"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Please provide a valid email address"),
  photoURL: z
    .string()
    .trim()
    .url("Photo URL must be a valid web link (e.g., https://...)")
    .refine(
      (val) => /^https?:\/\//i.test(val) && !/^(javascript|data|vbscript):/i.test(val),
      "Photo URL must start with http:// or https://"
    )
    .or(z.literal(""))
    .optional(),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
