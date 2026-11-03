import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <div className="glass flex flex-col h-full overflow-hidden p-3 rounded-[24px]">
      <Skeleton className="aspect-[16/10] w-full rounded-[18px] bg-neutral-200/50 dark:bg-white/10" />
      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5 rounded-full bg-neutral-200/50 dark:bg-white/10" />
          <Skeleton className="h-5 w-2/3 rounded-full bg-neutral-200/50 dark:bg-white/10" />
          <Skeleton className="h-3.5 w-full rounded-full bg-neutral-200/40 dark:bg-white/5 mt-2" />
        </div>
        <div className="space-y-2 pt-3 border-t border-foreground/10">
          <Skeleton className="h-3.5 w-3/4 rounded-full bg-neutral-200/40 dark:bg-white/5" />
          <Skeleton className="h-3.5 w-1/2 rounded-full bg-neutral-200/40 dark:bg-white/5" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-10 w-full rounded-full bg-neutral-200/50 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
