import { HeartHandshake } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="flex-1 w-full flex flex-col items-center justify-center px-4 py-6 sm:py-8 my-auto relative select-none"
    >
      {/* Ambient background glow orbs */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-foreground/5 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-2/3 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"
      />

      {/* Frosted liquid-glass loading capsule (Compact, Refined & Responsive) */}
      <div className="relative z-10 glass-strong rounded-[24px] p-6 sm:p-7 max-w-[270px] sm:max-w-[290px] w-full mx-auto flex flex-col items-center text-center shadow-xl border border-border/60">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-foreground/15 animate-ping"
            style={{ animationDuration: "2.5s" }}
          />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background shadow-xs">
            <HeartHandshake className="h-5 w-5 animate-pulse text-background" />
          </div>
        </div>

        {/* Brand Title */}
        <h2 className="mt-3.5 text-lg sm:text-xl font-semibold tracking-[-0.03em] text-foreground">
          Hatey<span className="text-muted-foreground font-normal ml-0.5">Hat</span>
        </h2>

        {/* Bengali Tagline */}
        <p className="text-[11px] text-muted-foreground font-normal tracking-normal mt-0.5">
          Hate hat, ekshathe poth chola
        </p>

        {/* Indeterminate Shimmer Progress Bar */}
        <div
          aria-hidden="true"
          className="mt-4 w-32 sm:w-36 h-1 rounded-full bg-foreground/10 overflow-hidden relative"
        >
          <div className="h-full w-1/3 rounded-full bg-foreground animate-indeterminate" />
        </div>
      </div>

      <span className="sr-only">Loading Hatey Hat content, please wait...</span>
    </div>
  );
}
