"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartHandshake } from "lucide-react";

interface PrivateRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PrivateRoute({ children, fallback }: PrivateRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const fullPath = React.useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (!isPending && !session?.user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(fullPath)}`;
      router.replace(redirectUrl);
    }
  }, [isPending, session, fullPath, router]);

  // Loading state: only show loading skeleton if session is pending and no user is in memory
  if (isPending && !session?.user) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-4xl space-y-8 animate-in fade-in-50">
        <div className="flex items-center gap-3 pb-6 border-b border-foreground/10">
          <div className="h-10 w-10 rounded-2xl bg-foreground text-background flex items-center justify-center animate-pulse">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-full bg-neutral-200/50 dark:bg-white/10" />
            <Skeleton className="h-4 w-72 rounded-full bg-neutral-200/40 dark:bg-white/5" />
          </div>
        </div>

        <div className="rounded-[32px] glass p-6 sm:p-10 space-y-6">
          <Skeleton className="h-6 w-1/3 rounded-full bg-neutral-200/50 dark:bg-white/10" />
          <Skeleton className="h-12 w-full rounded-2xl bg-neutral-200/40 dark:bg-white/5" />
          <Skeleton className="h-28 w-full rounded-2xl bg-neutral-200/40 dark:bg-white/5" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full rounded-2xl bg-neutral-200/40 dark:bg-white/5" />
            <Skeleton className="h-12 w-full rounded-2xl bg-neutral-200/40 dark:bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: will be redirected by useEffect; render skeleton to prevent flash
  if (!session?.user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          <p className="text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
