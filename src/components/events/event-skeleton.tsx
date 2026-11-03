import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <Skeleton className="aspect-[16/10] w-full" />
      <CardContent className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-full mt-2" />
        </div>
        <div className="space-y-2 pt-3 border-t border-border/70">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardFooter>
    </Card>
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
