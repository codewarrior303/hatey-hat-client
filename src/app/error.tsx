"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-lg flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in-50">
      <div className="rounded-[32px] glass p-8 sm:p-12 w-full flex flex-col items-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-destructive">
          System Notice
        </p>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-2">
          Something Went Wrong
        </h1>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred while loading this view. You can reload this section or return home.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="outline" className="gap-2 rounded-full h-11 px-6 glass">
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
          <Button asChild className="gap-2 rounded-full h-11 px-6 font-medium shadow-xs">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
