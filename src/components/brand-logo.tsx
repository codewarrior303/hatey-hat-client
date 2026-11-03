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
        "group inline-flex items-center gap-2.5 transition-transform hover:scale-[1.01]",
        className
      )}
      aria-label="Hatey Hat Home"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
        <HeartHandshake className="h-6 w-6 text-accent" />
      </div>
      <div className="flex flex-col">
        <span className="font-heading text-2xl font-bold tracking-tight text-foreground leading-tight">
          Hatey<span className="text-primary ml-1">Hat</span>
        </span>
        {showTagline && (
          <span className="text-xs text-muted-foreground font-medium -mt-0.5">
            Hate hat, ekshathe poth chola
          </span>
        )}
      </div>
    </Link>
  );
}
