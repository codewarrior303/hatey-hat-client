import Link from "next/link";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-lg flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in-50">
      <div className="rounded-[32px] glass p-8 sm:p-12 w-full flex flex-col items-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground mb-4">
          <Compass className="h-7 w-7 opacity-80" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          404 Not Found
        </p>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-2">
          Page Not Found
        </h1>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          The community initiative or page you are looking for may have concluded, been moved, or does not exist.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" className="gap-2 rounded-full h-11 px-6 glass">
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
              <span>Upcoming Events</span>
            </Link>
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
