import { HeartHandshake } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="flex-1 w-full min-h-[380px] flex flex-col items-center justify-center px-4 py-8 sm:py-12 my-auto relative select-none"
    >
      {/* Ambient background glow orbs */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-foreground/5 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-2/3 w-56 h-56 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"
      />

      {/* Frosted liquid-glass loading capsule */}
      <div className="relative z-10 glass-strong rounded-[32px] p-8 sm:p-10 max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-border/60 my-auto">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-foreground/15 animate-ping"
            style={{ animationDuration: "2.5s" }}
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
            <HeartHandshake className="h-7 w-7 animate-pulse text-background" />
          </div>
        </div>

        {/* Brand Title */}
        <h2 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-foreground">
          Hatey<span className="text-muted-foreground font-normal ml-0.5">Hat</span>
        </h2>

        {/* Bengali Tagline */}
        <p className="text-[12px] text-muted-foreground font-medium tracking-normal mt-1">
          Hate hat, ekshathe poth chola
        </p>

        {/* Indeterminate Shimmer Progress Bar */}
        <div
          aria-hidden="true"
          className="mt-6 w-44 h-1.5 rounded-full bg-foreground/10 overflow-hidden relative"
        >
          <div className="h-full w-1/3 rounded-full bg-foreground animate-indeterminate" />
        </div>

        {/* Status Pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-border/50 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Connecting community initiatives...</span>
        </div>
      </div>

      <span className="sr-only">Loading Hatey Hat content, please wait...</span>
    </div>
  );
}
