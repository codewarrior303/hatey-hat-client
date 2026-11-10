"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";

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

  // Loading state: return fallback if provided, otherwise render clean minimal placeholder without jarring icon flash
  if (isPending && !session?.user) {
    if (fallback) return <>{fallback}</>;
    return null;
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
