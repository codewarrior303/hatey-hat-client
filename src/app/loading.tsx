import { HeartHandshake } from "lucide-react";

export default function Loading() {
  return (
    <div
      aria-label="Loading"
      className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm animate-pulse transition-transform duration-700">
        <HeartHandshake className="h-6 w-6" />
      </div>
    </div>
  );
}
