"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, LogIn, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const getErrorMessage = () => {
    switch (error) {
      case "state_not_found":
      case "state_mismatch":
        return "Your authentication session expired or was interrupted. Please start the sign-in process again.";
      case "access_denied":
        return "Access was denied by the identity provider. Please try again if this was unintentional.";
      case "invalid_callback_request":
        return "The authentication callback received an invalid request format.";
      default:
        return (
          errorDescription ||
          "An authentication error occurred. Please try signing in again or return to the home page."
        );
    }
  };

  return (
    <div className="container mx-auto max-w-lg flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in-50">
      <div className="rounded-[32px] glass p-8 sm:p-12 w-full flex flex-col items-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Authentication Notice
        </p>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-2">
          Sign In Notice
        </h1>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          {getErrorMessage()}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gap-2 rounded-full h-11 px-6 font-medium shadow-xs">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              <span>Return to Sign In</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-full h-11 px-6 glass">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        </div>
      }
    >
      <ErrorContent />
    </React.Suspense>
  );
}
