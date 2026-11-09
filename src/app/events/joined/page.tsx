"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { apiFetch, type JoinItem } from "@/lib/api";
import { formatDate, getHighResImageUrl } from "@/lib/utils";

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
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-12 space-y-8 animate-in fade-in-50">
        <div className="space-y-1.5 pb-6 border-b border-foreground/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Volunteer Record
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            My Joined Activities
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-2xl">
            All the community events and volunteer initiatives you have
            registered to take part in, ordered by event date.
          </p>
        </div>

        {isLoading ? (
          <EventGridSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchJoinedEvents} />
        ) : joins.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Events Joined Yet"
            description="You haven't joined any volunteer events yet. Explore upcoming events across Bangladesh and take part."
            actionHref="/events"
            actionLabel="Discover Upcoming Events"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joins.map((join) => {
              const eventId =
                join.eventSlug ||
                (typeof join.eventId === "string"
                  ? join.eventId
                  : (join.eventId as any)?._id);
              return (
                <article
                  key={join._id}
                  className="glass glass-card flex flex-col h-full overflow-hidden p-3 rounded-[24px]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        getHighResImageUrl(join.eventThumbnail) ||
                        FALLBACK_IMAGE
                      }
                      alt={join.eventTitle}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
                        {join.eventType}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-3.5 space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-[17px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.8rem]">
                        {join.eventTitle}
                      </h3>
                    </div>

                    <div className="space-y-2 border-t border-foreground/10 pt-3 text-[13px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-foreground/70 shrink-0" />
                        <span className="font-medium text-foreground/90 truncate">
                          {formatDate(join.eventDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-foreground/70 shrink-0" />
                        <span className="truncate">{join.eventLocation}</span>
                      </div>
                    </div>

                    {eventId && (
                      <div className="pt-2">
                        <Button
                          asChild
                          className="w-full rounded-full gap-2 font-medium h-10 shadow-xs"
                        >
                          <Link href={`/events/${eventId}`}>
                            <span>View Event Details</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
