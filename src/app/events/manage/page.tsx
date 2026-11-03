"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  FolderKanban,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { PrivateRoute } from "@/components/auth/private-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { apiFetch, type EventItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80";

export default function ManageEventsPage() {
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Delete modal state
  const [eventToDelete, setEventToDelete] = React.useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchMyEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<EventItem[]>("/api/events/my", { auth: true });
      setEvents(res.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load your organized events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/api/events/${eventToDelete._id}`, {
        method: "DELETE",
        auth: true,
      });

      toast.success("Event and volunteer registrations deleted successfully");
      setEvents((prev) => prev.filter((e) => e._id !== eventToDelete._id));
      setEventToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not delete this event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-8 animate-in fade-in-50">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-2">
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
              <FolderKanban className="h-3.5 w-3.5 mr-1" />
              Organizer Panel
            </Badge>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Manage My Events
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              View, update, or cancel events you have organized. Only you have permission to modify
              your event records.
            </p>
          </div>

          <Button asChild className="gap-2 font-semibold shrink-0 self-start sm:self-auto">
            <Link href="/events/create">
              <PlusCircle className="h-4 w-4" />
              <span>Create New Event</span>
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <EventGridSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchMyEvents} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No Events Created Yet"
            description="You haven't organized any social service events yet. Create a drive to mobilize volunteers in your neighbourhood."
            actionHref="/events/create"
            actionLabel="Create an Event"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event._id}
                className="flex flex-col h-full overflow-hidden border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.thumbnail || FALLBACK_IMAGE}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="outline" className="bg-card/90 backdrop-blur-md font-bold shadow-xs">
                      {event.eventType}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-foreground leading-snug line-clamp-2 min-h-[3rem]">
                      {event.title}
                    </h3>
                  </div>

                  <div className="space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground/90 truncate">
                        {formatDate(event.eventDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/70">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 px-2 text-xs">
                      <Link href={`/events/${event._id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 px-2 text-xs">
                      <Link href={`/events/${event._id}/edit`}>
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventToDelete(event)}
                      className="gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Confirmation Modal: shadcn AlertDialog */}
        <AlertDialog open={Boolean(eventToDelete)} onOpenChange={(open) => !open && setEventToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <AlertDialogTitle>Delete Community Event?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2 leading-relaxed">
                Are you sure you want to delete &ldquo;
                <strong className="text-foreground">{eventToDelete?.title}</strong>&rdquo;?
                This action is permanent and will remove all volunteer joins associated with this event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Event</span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PrivateRoute>
  );
}
