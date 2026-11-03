import { HeartHandshake, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      aria-label="Loading page"
      className="container mx-auto flex min-h-[65vh] flex-col items-center justify-center px-4 py-20 text-center animate-in fade-in-50 duration-300"
    >
      <div className="relative flex flex-col items-center space-y-5">
        {/* Apple-style squircle brand badge */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg transition-transform">
          <HeartHandshake className="h-7 w-7 animate-pulse" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            Hatey<span className="text-muted-foreground font-normal ml-0.5">Hat</span>
          </h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Hate hat, ekshathe poth chola
          </p>
        </div>

        {/* Subtle Minimal Spinner */}
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-foreground" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
