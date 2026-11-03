"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EventForm } from "@/components/events/event-form";
import { apiFetch, type EventItem } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { data: session } = useSession();

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
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-4xl space-y-8 animate-in fade-in-50">
        <div>
          <Link
            href="/events/manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Manage Events</span>
          </Link>
        </div>

        <div className="space-y-2 pb-6 border-b border-border">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            <Edit3 className="h-3.5 w-3.5 mr-1" />
            Update Event
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Edit Event Details
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Update your event information. All fields are validated and existing participants will see
            updated schedules automatically.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : error || !event ? (
          <ErrorState
            title="Event Not Found"
            message={error || "We could not find the event you requested."}
            onRetry={fetchEvent}
          />
        ) : session?.user?.email && event.creatorEmail !== session.user.email ? (
          <ErrorState
            title="Access Restricted"
            message="Only the organizer who created this event is authorized to modify its details."
          />
        ) : (
          <EventForm initialData={event} isEditing />
        )}
      </div>
    </PrivateRoute>
  );
}
