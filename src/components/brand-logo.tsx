import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
}

export function BrandLogo({ className, showTagline = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 select-none",
        className
      )}
      aria-label="Hatey Hat Home"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-xs shrink-0">
        <HeartHandshake className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Hatey<span className="text-muted-foreground font-normal ml-0.5">Hat</span>
        </span>
        {showTagline && (
          <span className="text-[11px] text-muted-foreground font-normal tracking-normal -mt-0.5">
            Hate hat, ekshathe poth chola
          </span>
        )}
      </div>
    </Link>
  );
}
