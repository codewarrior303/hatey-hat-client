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
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { PrivateRoute } from "@/components/auth/private-route";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, invalidateCache, type EventItem } from "@/lib/api";
import { formatDate, getHighResImageUrl } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80";

export default function ManageEventsPage() {
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Delete modal state
  const [eventToDelete, setEventToDelete] = React.useState<EventItem | null>(
    null,
  );
  const [cancellationReason, setCancellationReason] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isUnconcluded = eventToDelete
    ? new Date(eventToDelete.eventDate).getTime() > Date.now()
    : false;

  const fetchMyEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<EventItem[]>("/api/events/my", {
        auth: true,
        skipCache: true,
      });
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
    if (isUnconcluded && cancellationReason.trim().length < 5) {
      toast.error("Please provide a cancellation reason with at least 5 characters.");
      return;
    }

    try {
      setIsDeleting(true);
      const res = await apiFetch<any>(`/api/events/${eventToDelete._id}`, {
        method: "DELETE",
        auth: true,
        body: JSON.stringify({ reason: cancellationReason.trim() }),
      });

      const strike = res.data?.strikeStatus;
      if (strike) {
        if (strike.stage === "suspended") {
          toast.error(
            "Event cancelled. Your creation privileges are now suspended (3 early cancellations reached). Submit an appeal on the Organize page.",
            { duration: 6000 }
          );
        } else if (strike.stage === "permanently_banned") {
          toast.error(
            "Event cancelled. Your account is permanently barred from creating events due to policy violation after reinstatement.",
            { duration: 7000 }
          );
        } else if (strike.stage === "probation") {
          toast(
            `Event cancelled. Probation warning: ${strike.remainingStrikes} strike remaining before permanent ban.`,
            { icon: "⚠️", duration: 6000 }
          );
        } else {
          toast(
            `Event cancelled. Early cancellations before conclusion: ${strike.earlyCancellations}/3.`,
            { icon: "ℹ️", duration: 4000 }
          );
        }
      } else {
        toast.success("Event and volunteer registrations deleted successfully");
      }

      invalidateCache();
      setEvents((prev) => prev.filter((e) => e._id !== eventToDelete._id));
      setEventToDelete(null);
      setCancellationReason("");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete this event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-12 space-y-8 animate-in fade-in-50">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-foreground/10">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Organizer Panel
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              Manage My Events
            </h1>
            <p className="text-[15px] text-muted-foreground max-w-2xl">
              View, update, or cancel events you have organized. Only you have
              permission to modify your event records.
            </p>
          </div>

          <Button
            asChild
            className="gap-2 font-medium shrink-0 self-start sm:self-auto rounded-full h-11 px-6 shadow-xs"
          >
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
              <article
                key={event._id}
                className="glass glass-card flex flex-col h-full overflow-hidden p-3 rounded-[24px]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHighResImageUrl(event.thumbnail) || FALLBACK_IMAGE}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
                      {event.eventType}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-3.5 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-[17px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.8rem]">
                      {event.title}
                    </h3>
                  </div>

                  <div className="space-y-2 border-t border-foreground/10 pt-3 text-[13px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-foreground/70 shrink-0" />
                      <span className="font-medium text-foreground/90 truncate">
                        {formatDate(event.eventDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-foreground/70 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Volunteers Roster Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-full text-xs h-9 font-medium glass border-foreground/15 hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Link href={`/events/${event._id}/participants`}>
                      <Users className="h-3.5 w-3.5" />
                      <span>Volunteers Roster & PDF</span>
                    </Link>
                  </Button>

                  {/* Actions Row */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-foreground/10">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full px-2 text-xs h-9 glass"
                    >
                      <Link href={`/events/${event._id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full px-2 text-xs h-9 glass"
                    >
                      <Link href={`/events/${event._id}/edit`}>
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventToDelete(event)}
                      className="gap-1.5 rounded-full px-2 text-xs h-9 text-destructive hover:bg-destructive/10 border-destructive/20 glass"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Confirmation Modal: shadcn AlertDialog in Liquid Glass */}
        <AlertDialog
          open={Boolean(eventToDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setEventToDelete(null);
              setCancellationReason("");
            }
          }}
        >
          <AlertDialogContent className="glass-strong border-border/50 rounded-[28px] p-6 sm:p-8 max-w-md shadow-2xl">
            <AlertDialogHeader className="space-y-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto sm:mx-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">
                {isUnconcluded
                  ? "Cancel Unconcluded Event?"
                  : "Delete Concluded Event?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                This will permanently remove{" "}
                <strong className="text-foreground font-semibold">
                  &ldquo;{eventToDelete?.title}&rdquo;
                </strong>{" "}
                and all associated volunteer registrations.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {isUnconcluded && (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Reason for Early Cancellation <span className="text-destructive">*</span>
                  </label>
                  <span className={`text-[11px] ${cancellationReason.trim().length < 5 ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}`}>
                    {cancellationReason.trim().length} / 5 min chars
                  </span>
                </div>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Explain why this active initiative is being cancelled before its conclusion..."
                  className="min-h-[85px] text-xs bg-background/50 border-foreground/15 rounded-xl resize-none"
                  disabled={isDeleting}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <strong className="text-amber-500">Notice:</strong> Early cancellations before conclusion are monitored to protect volunteers. Cancelling 3 active drives suspends your event organizing privileges.
                </p>
              </div>
            )}

            <AlertDialogFooter className="gap-2 sm:gap-3 pt-4 border-t border-foreground/10">
              <AlertDialogCancel
                disabled={isDeleting}
                onClick={() => {
                  setEventToDelete(null);
                  setCancellationReason("");
                }}
                className="rounded-full glass h-11 px-5 font-medium border-border/60"
              >
                Keep Event
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={
                  isDeleting ||
                  (isUnconcluded && cancellationReason.trim().length < 5)
                }
                className="rounded-full bg-destructive text-destructive-foreground hover:opacity-90 h-11 px-6 font-medium shadow-xs disabled:opacity-40 disabled:pointer-events-none"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  "Confirm Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PrivateRoute>
  );
}
