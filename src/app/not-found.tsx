import Link from "next/link";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Compass className="h-8 w-8 animate-pulse" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-accent">
        404 Page Not Found
      </p>

      <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mt-2">
        This Page Does Not Exist
      </h1>

      <p className="mt-3 max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
        The community page or event you are looking for may have been moved, deleted,
        or never existed in our directory.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
            <span>Upcoming Events</span>
          </Link>
        </Button>
        <Button asChild className="gap-2 font-semibold">
          <Link href="/">
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
