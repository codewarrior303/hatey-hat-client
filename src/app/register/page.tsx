"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ArrowRight, Image as ImageIcon, Lock, Mail, User, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    mode: "onChange",
  });

  const passwordValue = watch("password", "");

  // Real-time password requirement indicators
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
        toast.error(res.error.message || "Failed to create account");
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
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo showTagline />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground pt-3">
            Join the Community
          </h1>
          <p className="text-sm text-muted-foreground">
            Register to organize, join, and support community drives around Dhaka.
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Create an Account</CardTitle>
            <CardDescription>
              Fill in your details to get started with Hatey Hat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Login: Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2.5 h-11 font-medium bg-background hover:bg-muted"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              <span>Sign up with Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">
                  Or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Abir Rahman"
                    className="pl-9"
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
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="volunteers@hateyhat.org"
                    className="pl-9"
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
                  Profile Picture URL{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="photoURL"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="pl-9"
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
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    autoComplete="new-password"
                    {...register("password")}
                    aria-invalid={Boolean(errors.password)}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}

                {/* Password Rule Checklist */}
                <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1.5 mt-2">
                  <p className="font-semibold text-foreground/80">Password Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {hasMinLength ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-60" />
                      )}
                      At least 6 chars
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasUppercase ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {hasUppercase ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-60" />
                      )}
                      1 uppercase (A-Z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasLowercase ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {hasLowercase ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-60" />
                      )}
                      1 lowercase (a-z)
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-semibold h-10 mt-2"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-border/80 pt-4 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link
                href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
