"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Image as ImageIcon,
  Lock,
  Mail,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/icons/google-icon";
import { BrandLogo } from "@/components/brand-logo";
import { signUp, signIn, useSession } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth.validator";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const { data: session, isPending: sessionPending } = useSession();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      photoURL: "",
      password: "",
    },
  });

  const passwordValue = watch("password") || "";
  const hasMinLength = passwordValue.length >= 6;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);

  // If already logged in, redirect away
  React.useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace(redirectUrl);
    }
  }, [session, sessionPending, redirectUrl, router]);

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true);

      const res = await signUp.email({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        image: data.photoURL?.trim() || undefined,
      });

      if (res.error) {
        toast.error(res.error.message || "Registration failed. Please check your details.");
        return;
      }

      toast.success("Account created successfully! Welcome to Hatey Hat.");
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
      });
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
            Join the community.
          </h1>
          <p className="text-sm text-muted-foreground">
            Create an account to organize drives and register for local initiatives.
          </p>
        </div>

        <div className="rounded-[32px] glass p-8 sm:p-10 shadow-lg space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Create Account</h2>
            <p className="text-xs text-muted-foreground">
              Sign up with Google or your email to get started.
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
              <span>Sign up with Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="glass px-3 py-0.5 rounded-full text-muted-foreground font-medium text-[11px]">
                  Or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Abir Rahman"
                    className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="name"
                    {...register("name")}
                    aria-invalid={Boolean(errors.name)}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="volunteer@example.com"
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

              {/* Photo URL */}
              <div className="space-y-1.5">
                <Label htmlFor="photoURL">
                  Avatar Image URL{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="photoURL"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    {...register("photoURL")}
                    aria-invalid={Boolean(errors.photoURL)}
                  />
                </div>
                {errors.photoURL && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.photoURL.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-11 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    autoComplete="new-password"
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

                {/* Password Rule Checklist */}
                <div className="rounded-2xl glass p-3 text-xs space-y-1.5 mt-2">
                  <p className="font-semibold text-foreground/80">Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? "text-foreground font-medium" : "text-muted-foreground"
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
                        hasUppercase ? "text-foreground font-medium" : "text-muted-foreground"
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
                        hasLowercase ? "text-foreground font-medium" : "text-muted-foreground"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 rounded-full font-medium h-11 mt-2 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center pt-2 border-t border-foreground/10 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={redirectUrl !== "/" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
              className="font-semibold text-foreground hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
