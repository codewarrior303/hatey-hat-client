import { HeartHandshake } from "lucide-react";

export default function Loading() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 animate-pulse">
        <HeartHandshake className="h-7 w-7 text-primary animate-bounce" />
      </div>
      <p className="font-heading text-lg font-semibold text-foreground">
        Loading Hatey Hat...
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Hate hat, ekshathe poth chola
      </p>
    </div>
  );
}
