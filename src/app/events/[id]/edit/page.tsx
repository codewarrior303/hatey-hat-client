"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EventForm } from "@/components/events/event-form";
import { apiFetch, type EventItem } from "@/lib/api";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEvent = React.useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<EventItem>(`/api/events/${eventId}`);
      setEvent(res.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 max-w-4xl space-y-8 animate-in fade-in-50">
        <div>
          <Link
            href="/events/manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors glass rounded-full px-4 py-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Manage Events</span>
          </Link>
        </div>

        <div className="space-y-2 pb-6 border-b border-foreground/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Organizer Access
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Update Event Details
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-2xl">
            Update your initiative&apos;s schedule, meeting landmark,
            description, or thumbnail image.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-[32px] glass p-8 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-full bg-neutral-200/50 dark:bg-white/10" />
            <Skeleton className="h-24 w-full rounded-[20px] bg-neutral-200/40 dark:bg-white/5" />
            <Skeleton className="h-12 w-full rounded-full bg-neutral-200/50 dark:bg-white/10" />
          </div>
        ) : error || !event ? (
          <ErrorState
            title="Could Not Load Event"
            message={error || "Event not found"}
            onRetry={fetchEvent}
          />
        ) : (
          <EventForm initialData={event} isEditing />
        )}
      </div>
    </PrivateRoute>
  );
}
