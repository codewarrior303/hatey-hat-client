"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/google-icon";
import { BrandLogo } from "@/components/brand-logo";
import { authClient, signIn, useSession } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validators/auth.validator";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const { data: session, isPending: sessionPending } = useSession();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

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

  const onSubmit = async (data: LoginInput) => {
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
      <div className="w-full max-w-md space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo showTagline />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground pt-3">
            Welcome Back to Hatey Hat
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue connecting with your local community.
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account.
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
              <span>Continue with Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    autoComplete="current-password"
                    {...register("password")}
                    aria-invalid={Boolean(errors.password)}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-semibold h-10 mt-2"
                disabled={isLoading || isGoogleLoading}
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
          </CardContent>
          <CardFooter className="flex flex-col border-t border-border/80 pt-4 text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account yet?{" "}
              <Link
                href={`/register${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
