"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import {
  forgotPasswordEmailSchema,
  resetPasswordSchema,
  ForgotPasswordEmailInput,
  ResetPasswordInput,
} from "@/lib/validators/auth.validator";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form for Step 1 (Email verification)
  const emailForm = useForm<ForgotPasswordEmailInput>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  // Form for Step 2 (Reset password)
  const passwordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchedNewPassword = passwordForm.watch("newPassword") || "";
  const watchedConfirmPassword = passwordForm.watch("confirmPassword") || "";

  // Password requirement live checks
  const hasMinLength = watchedNewPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(watchedNewPassword);
  const hasLowercase = /[a-z]/.test(watchedNewPassword);
  const passwordsMatch =
    watchedConfirmPassword.length > 0 &&
    watchedNewPassword === watchedConfirmPassword;

  // Handle Step 1: Verify Email
  const onVerifyEmail = async (data: ForgotPasswordEmailInput) => {
    try {
      setIsVerifyingEmail(true);
      const normalizedEmail = data.email.toLowerCase().trim();

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-email",
          email: normalizedEmail,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "No account found with this email address. Please register first."
        );
        return;
      }

      setVerifiedEmail(normalizedEmail);
      toast.success(
        result.message || "Email verified! Please enter your new password."
      );
      setStep(2);
    } catch (err: any) {
      toast.error(
        err?.message || "Could not verify email. Please try again."
      );
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Handle Step 2: Reset Password
  const onResetPassword = async (data: ResetPasswordInput) => {
    if (!verifiedEmail) {
      toast.error("Session expired. Please re-verify your email.");
      setStep(1);
      return;
    }

    try {
      setIsResettingPassword(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: verifiedEmail,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Failed to update password. Please try again."
        );
        return;
      }

      toast.success(
        "Password changed successfully! Please sign in with your new password."
      );
      router.push("/login");
    } catch (err: any) {
      toast.error(
        err?.message || "An unexpected error occurred while resetting password."
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo showTagline />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground pt-3">
            {step === 1 ? "Forgot Password" : "Create New Password"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {step === 1
              ? "Enter your registered email address to verify your account."
              : "Choose a strong password to secure your account."}
          </p>
        </div>

        {/* Step Progression Pills */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 1
                ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                : "glass bg-foreground/5 text-muted-foreground border-foreground/15"
            }`}
          >
            <span>1</span>
            <span>Verify Email</span>
          </div>
          <div className="w-4 h-px bg-foreground/20" />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 2
                ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                : "glass bg-foreground/5 text-muted-foreground border-foreground/15"
            }`}
          >
            <span>2</span>
            <span>New Password</span>
          </div>
        </div>

        <div className="rounded-[32px] glass p-8 sm:p-10 shadow-lg space-y-6">
          {/* STEP 1: VERIFY EMAIL */}
          {step === 1 && (
            <form
              onSubmit={emailForm.handleSubmit(onVerifyEmail)}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full glass bg-foreground/5 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Account Email
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      We will check if your account exists in our database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="volunteer@gmail.com"
                    className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="email"
                    {...emailForm.register("email")}
                    aria-invalid={Boolean(emailForm.formState.errors.email)}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-xs font-medium text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isVerifyingEmail}
                className="w-full h-11 rounded-full font-medium gap-2 shadow-sm"
              >
                {isVerifyingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking database...
                  </>
                ) : (
                  <>
                    Continue to Next Step
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: NEW PASSWORD & CONFIRM PASSWORD */}
          {step === 2 && (
            <form
              onSubmit={passwordForm.handleSubmit(onResetPassword)}
              className="space-y-5"
            >
              {/* Account badge with change option */}
              <div className="rounded-2xl glass p-3.5 flex items-center justify-between border border-foreground/10 bg-foreground/[0.02]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">
                      Verified Account
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {verifiedEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              {/* 1. New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">1. New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-10 pr-11 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                    aria-invalid={Boolean(
                      passwordForm.formState.errors.newPassword
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}

                {/* Password Rule Checklist */}
                <div className="rounded-2xl glass p-3 text-xs space-y-1.5 mt-2">
                  <p className="font-semibold text-foreground/80">
                    Requirements:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasMinLength
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {hasMinLength ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-40" />
                      )}
                      6+ chars
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasUppercase
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {hasUppercase ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-40" />
                      )}
                      1 uppercase
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasLowercase
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {hasLowercase ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-40" />
                      )}
                      1 lowercase
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Confirm Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmPassword">2. Confirm Password</Label>
                  {watchedConfirmPassword.length > 0 && (
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        passwordsMatch
                          ? "text-emerald-500"
                          : "text-destructive"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> Passwords do not match
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="pl-10 pr-11 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                    aria-invalid={Boolean(
                      passwordForm.formState.errors.confirmPassword
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isResettingPassword}
                className="w-full h-11 rounded-full font-medium gap-2 shadow-sm"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password in database...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Confirm & Update Password
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-foreground/10">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
