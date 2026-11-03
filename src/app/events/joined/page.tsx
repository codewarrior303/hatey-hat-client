"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { apiFetch, type JoinItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80";

export default function JoinedEventsPage() {
  const [joins, setJoins] = React.useState<JoinItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchJoinedEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<JoinItem[]>("/api/joins/my", { auth: true });
      setJoins(res.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load joined events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJoinedEvents();
  }, [fetchJoinedEvents]);

  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-8 animate-in fade-in-50">
        <div className="space-y-2 pb-6 border-b border-border">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Volunteer Record
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            My Joined Events
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            All the social welfare drives and volunteer events you have registered to take part in,
            ordered by event date.
          </p>
        </div>

        {isLoading ? (
          <EventGridSkeleton count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchJoinedEvents} />
        ) : joins.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Events Joined Yet"
            description="You haven't joined any volunteer events yet. Explore upcoming drives around Dhaka and take part."
            actionHref="/events"
            actionLabel="Discover Upcoming Events"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joins.map((join) => {
              const eventId = typeof join.eventId === "string" ? join.eventId : (join.eventId as any)?._id;
              return (
                <Card
                  key={join._id}
                  className="flex flex-col h-full overflow-hidden border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={join.eventThumbnail || FALLBACK_IMAGE}
                      alt={join.eventTitle}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-card/90 backdrop-blur-md font-bold shadow-xs">
                        {join.eventType}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-heading text-lg font-bold text-foreground leading-snug line-clamp-2 min-h-[3rem]">
                        {join.eventTitle}
                      </h3>
                    </div>

                    <div className="space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground/90 truncate">
                          {formatDate(join.eventDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{join.eventLocation}</span>
                      </div>

                      <div className="flex items-center gap-2 text-primary font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Joined on {new Date(join.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button asChild className="w-full gap-2 font-semibold mt-2">
                      <Link href={`/events/${eventId}`}>
                        <span>View Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
