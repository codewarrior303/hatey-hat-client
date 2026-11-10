"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ArrowRight, Lock, Mail, Loader2, Eye, EyeOff, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/icons/google-icon";
import { BrandLogo } from "@/components/brand-logo";
import { signIn, useSession } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validators/auth.validator";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const { data: session, isPending: sessionPending } = useSession();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // If already logged in, redirect away
  React.useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace(redirectUrl);
    }
  }, [session, sessionPending, redirectUrl, router]);

  const errorShownRef = React.useRef<string | null>(null);

  // Surface authentication errors (e.g. from OAuth callbacks or state failures)
  React.useEffect(() => {
    const authError = searchParams.get("error");
    if (authError && errorShownRef.current !== authError) {
      errorShownRef.current = authError;
      if (authError === "state_not_found" || authError === "state_mismatch") {
        toast.error("Sign-in session expired or was interrupted. Please try again.", {
          id: "auth-oauth-error",
        });
      } else if (authError === "oauth_failed" || authError === "access_denied") {
        toast.error("Google sign-in was cancelled or could not be completed.", {
          id: "auth-oauth-error",
        });
      } else {
        toast.error("Authentication could not be completed. Please try again.", {
          id: "auth-oauth-error",
        });
      }
      // Clean up error query param from address bar so it never triggers duplicate toast
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams]);

  // Reset loading states when navigating back via browser history (bfcache) or when page regains visibility
  React.useEffect(() => {
    const resetLoadingStates = () => {
      setIsGoogleLoading(false);
      setIsLoading(false);
    };

    window.addEventListener("pageshow", resetLoadingStates);
    window.addEventListener("popstate", resetLoadingStates);
    window.addEventListener("focus", resetLoadingStates);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetLoadingStates();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetLoadingStates);
      window.removeEventListener("popstate", resetLoadingStates);
      window.removeEventListener("focus", resetLoadingStates);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const onSubmit = async (data: LoginInput) => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await signIn.email({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (res.error) {
        toast.error(res.error.message || "Invalid email or password");
        return;
      }

      toast.success("Welcome back! You have logged in successfully.");
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const fallbackTimer = setTimeout(() => {
        setIsGoogleLoading(false);
      }, 7000);

      await signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
      });
      clearTimeout(fallbackTimer);
    } catch (err: any) {
      toast.error(err?.message || "Could not connect to Google sign in");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo showTagline />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground pt-3">
            Welcome back.
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue connecting with your local community.
          </p>
        </div>

        <div className="rounded-[32px] glass p-8 sm:p-10 shadow-lg space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access your volunteer dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {/* Social Login: Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2.5 h-11 rounded-full font-medium glass"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              <span>Continue with Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="glass px-3 py-0.5 rounded-full text-muted-foreground font-medium text-[11px]">
                  Or email
                </span>
              </div>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="volunteer@gmail.com"
                    className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="email"
                    {...register("email")}
                    aria-invalid={Boolean(errors.email)}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-11 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="current-password"
                    {...register("password")}
                    aria-invalid={Boolean(errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Terms & Privacy Checkbox */}
              <div
                role="checkbox"
                aria-checked={agreedToTerms}
                tabIndex={0}
                onClick={() => setAgreedToTerms((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setAgreedToTerms((prev) => !prev);
                  }
                }}
                className="flex items-start gap-2.5 pt-1 group cursor-pointer select-none"
              >
                <div
                  className={`h-4 w-4 mt-0.5 rounded-[5px] flex items-center justify-center transition-all duration-150 shrink-0 ${
                    agreedToTerms
                      ? "bg-foreground text-background border border-foreground shadow-xs"
                      : "glass bg-foreground/5 border border-foreground/20 group-hover:border-foreground/50 group-hover:bg-foreground/10"
                  }`}
                >
                  {agreedToTerms && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <label className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                  I agree to Hatey Hat&apos;s{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full gap-2 rounded-full font-medium h-11 mt-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center pt-2 border-t border-foreground/10 text-xs text-muted-foreground">
            Don&apos;t have an account yet?{" "}
            <Link
              href={redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
              className="font-semibold text-foreground hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
