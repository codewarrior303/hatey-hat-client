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

export const emailSchema = z
  .string({ error: "Email address is required" })
  .trim()
  .min(5, "Email address is too short")
  .max(100, "Email address cannot exceed 100 characters")
  .email("Please provide a valid email address (e.g. name@gmail.com)")
  .refine(
    (val) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(val.trim()),
    { message: "Please enter a valid @gmail.com address." }
  );

export const registerEmailSchema = emailSchema;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string({ error: "Full name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name cannot exceed 80 characters"),
  email: registerEmailSchema,
  photoURL: z
    .string()
    .trim()
    .refine(
      (val) =>
        !val ||
        /^https?:\/\//i.test(val) ||
        /^\/api\/upload\/image\/[a-f0-9]{24}$/i.test(val),
      "Photo URL must be a valid image link or uploaded file"
    )
    .or(z.literal(""))
    .optional(),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z
      .string({ error: "Please confirm your password" })
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordEmailInput = z.infer<typeof forgotPasswordEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
