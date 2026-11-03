"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  scrollToTop?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function BrandLogo({
  className,
  showTagline = false,
  scrollToTop = false,
  onClick,
}: BrandLogoProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    // If user is already on homepage, smoothly scroll to top without full page reload
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // If requested to scrollToTop explicitly (e.g. from footer)
    if (scrollToTop) {
      e.preventDefault();
      router.push("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 60);
      return;
    }

    // When on another route, standard Next.js <Link> navigates via SPA routing without browser reload
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2.5 select-none group cursor-pointer transition-opacity hover:opacity-90",
        className
      )}
      aria-label="Hatey Hat Home"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105 active:scale-95">
        <HeartHandshake className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Hatey<span className="text-muted-foreground font-normal ml-0.5">Hat</span>
        </span>
        {showTagline && (
          <span className="text-[11px] text-muted-foreground font-normal tracking-normal -mt-0.5 group-hover:text-foreground transition-colors">
            Hate hat, ekshathe poth chola
          </span>
        )}
      </div>
    </Link>
  );
}

