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
import { formatDate, getHighResImageUrl, formatCompactNumber } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80";

function validateCancellationReason(text: string): { valid: boolean; message: string } {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const length = trimmed.length;

  if (length < 15) {
    return {
      valid: false,
      message: `Minimum 15 characters required (${length}/15)`,
    };
  }

  if (words.length < 3) {
    return {
      valid: false,
      message: `Please write a complete explanation (at least 3 descriptive words, currently ${words.length})`,
    };
  }

  // Check character diversity to block repetitive characters (e.g. aaaaaaaaaaaaaaa)
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s+/g, "")).size;
  if (uniqueChars < 5) {
    return {
      valid: false,
      message: "Please write a genuine, meaningful explanation for volunteers",
    };
  }

  // Check unique words to block repeating the same word
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
  if (uniqueWords < 2) {
    return {
      valid: false,
      message: "Please write a genuine, meaningful explanation for volunteers",
    };
  }

  return {
    valid: true,
    message: "Meaningful reason provided",
  };
}

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

  const reasonValidation = React.useMemo(
    () => validateCancellationReason(cancellationReason),
    [cancellationReason]
  );

  const isUnconcluded = React.useMemo(() => {
    if (!eventToDelete) return false;
    return new Date(eventToDelete.eventDate).getTime() > new Date().getTime();
  }, [eventToDelete]);

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
    if (isUnconcluded && !reasonValidation.valid) {
      toast.error(reasonValidation.message);
      return;
    }

    try {
      setIsDeleting(true);
      await apiFetch<any>(`/api/events/${eventToDelete._id}`, {
        method: "DELETE",
        auth: true,
        body: JSON.stringify({ reason: cancellationReason.trim() }),
      });

      // Always show concise, clean confirmation as requested
      toast.success("Event cancelled");

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
            description="You haven't organized any social service events yet. Create an event to mobilize volunteers in your neighbourhood."
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

                    <div className="flex items-center gap-2 text-foreground/80">
                      <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-foreground/90">
                        {formatCompactNumber(event.participants ?? 0)}{" "}
                        {(event.participants ?? 0) === 1 ? "volunteer joined" : "volunteers joined"}
                      </span>
                    </div>
                  </div>

                  {/* Volunteers Roster Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-full text-xs h-9 font-medium glass border-foreground/15 hover:border-foreground/35 hover:bg-foreground/10 text-foreground transition-all"
                  >
                    <Link href={`/events/${event.slug || event._id}/participants`}>
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        Volunteers Roster & PDF (
                        {formatCompactNumber(event.participants ?? 0)})
                      </span>
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
                      <Link href={`/events/${event.slug || event._id}`}>
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
                      <Link href={`/events/${event.slug || event._id}/edit`}>
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
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      reasonValidation.valid
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}
                  >
                    {reasonValidation.valid
                      ? "✓ Meaningful reason"
                      : "Please write a meaningful reason"}
                  </span>
                </div>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Explain clearly why this active initiative is being cancelled (e.g. Severe waterlogging at venue, medical emergency, rescheduled to next weekend...)"
                  className="min-h-[85px] text-xs bg-background/50 border-foreground/15 rounded-xl resize-none"
                  disabled={isDeleting}
                />
                {!reasonValidation.valid && cancellationReason.trim().length > 0 && (
                  <p className="text-[11px] text-amber-500 font-medium">
                    {reasonValidation.message}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <strong className="text-amber-500">Notice:</strong> Early cancellations before conclusion are monitored to protect volunteers. Cancelling 3 active events suspends your event organizing privileges.
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
                  (isUnconcluded && !reasonValidation.valid)
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
