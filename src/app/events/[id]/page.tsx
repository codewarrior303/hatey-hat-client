"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Users,
  User,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Share2,
  HeartHandshake,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useSession } from "@/lib/auth-client";
import { apiFetch, type EventItem, ClientApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: session } = useSession();

  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [isPast, setIsPast] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isJoining, setIsJoining] = React.useState(false);
  const [hasJoined, setHasJoined] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imgSrc, setImgSrc] = React.useState<string>("");

  const fetchEvent = React.useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<EventItem>(`/api/events/${eventId}`);
      setEvent(res.data);
      setIsPast(new Date(res.data.eventDate).getTime() <= Date.now());
      setImgSrc(res.data.thumbnail || FALLBACK_IMAGE);
    } catch (err: any) {
      setError(err?.message || "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Check if current user has already joined
  const checkJoinStatus = React.useCallback(async () => {
    if (!session?.user || !eventId) return;
    try {
      const res = await apiFetch<any[]>("/api/joins/my", { auth: true });
      const alreadyJoined = res.data?.some(
        (j: any) => j.eventId === eventId || j.eventId?._id === eventId
      );
      if (alreadyJoined) setHasJoined(true);
    } catch {
      // Ignore join check failure
    }
  }, [session, eventId]);

  React.useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  React.useEffect(() => {
    checkJoinStatus();
  }, [checkJoinStatus]);

  const handleJoinEvent = async () => {
    // If not logged in, redirect to login with return path
    if (!session?.user) {
      toast("Please sign in to join this community event", {
        icon: "👋",
      });
      router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }

    try {
      setIsJoining(true);
      const res = await apiFetch(`/api/events/${eventId}/join`, {
        method: "POST",
        auth: true,
      });

      toast.success(res.message || "You have successfully joined this event! See you there.");
      setHasJoined(true);
      if (event && typeof event.participants === "number") {
        setEvent({ ...event, participants: event.participants + 1 });
      }
    } catch (err: any) {
      if (err instanceof ClientApiError && err.statusCode === 409) {
        toast.success("You are already registered for this event. See you there!");
        setHasJoined(true);
      } else {
        toast.error(err?.message || "Could not join this event. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-4xl space-y-8 animate-in fade-in-50">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="aspect-[21/9] w-full rounded-[28px] bg-neutral-200/50 dark:bg-white/10" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4 rounded-full bg-neutral-200/50 dark:bg-white/10" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-40 rounded-full bg-neutral-200/40 dark:bg-white/5" />
            <Skeleton className="h-5 w-40 rounded-full bg-neutral-200/40 dark:bg-white/5" />
          </div>
          <Skeleton className="h-32 w-full rounded-[24px] bg-neutral-200/30 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <ErrorState
          title="Event Not Found"
          message={error || "We could not find the event you were looking for."}
          onRetry={fetchEvent}
        />
        <div className="text-center mt-6">
          <Button asChild variant="outline" className="rounded-full glass">
            <Link href="/events" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Upcoming Events</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors glass rounded-full px-4 py-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Hero Banner Image in Glass Container */}
      <div className="relative aspect-[21/9] sm:aspect-[2/1] w-full overflow-hidden rounded-[28px] glass p-2 shadow-sm">
        <div className="w-full h-full overflow-hidden rounded-[22px] bg-neutral-100 dark:bg-neutral-900 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={event.title}
            className="h-full w-full object-cover"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
              {event.eventType}
            </span>
            {isPast && (
              <Badge variant="destructive" className="font-semibold rounded-full">
                Concluded
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-foreground/10">
          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
              {event.title}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 text-foreground/70 shrink-0" />
              <span>Organized by <strong className="text-foreground font-semibold">{event.creatorName}</strong></span>
              <span className="text-xs">({event.creatorEmail})</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    aria-label="Share event link"
                    className="rounded-full h-11 w-11 glass hover:scale-105 transition-transform"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Share event link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {hasJoined ? (
              <Button
                variant="secondary"
                size="lg"
                className="gap-2 font-medium rounded-full h-11 px-6 glass bg-foreground/10 text-foreground cursor-default"
                disabled
              >
                <CheckCircle2 className="h-4 w-4 text-foreground" />
                <span>You Have Joined</span>
              </Button>
            ) : isPast ? (
              <Button variant="outline" size="lg" disabled className="gap-2 rounded-full h-11 px-6">
                <AlertTriangle className="h-4 w-4" />
                <span>Past Event</span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleJoinEvent}
                disabled={isJoining}
                className="gap-2 font-medium rounded-full h-11 px-7 shadow-sm"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake className="h-4 w-4" />
                    <span>Join Event</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Info Grid (3 Glass Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass p-5 rounded-[22px] space-y-1">
            <div className="flex items-center gap-2.5 text-foreground/80 mb-1">
              <CalendarDays className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Date & Time
              </p>
            </div>
            <p className="text-[15px] font-semibold text-foreground">
              {formatDate(event.eventDate)}
            </p>
          </div>

          <div className="glass p-5 rounded-[22px] space-y-1">
            <div className="flex items-center gap-2.5 text-foreground/80 mb-1">
              <MapPin className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Location
              </p>
            </div>
            <p className="text-[15px] font-semibold text-foreground truncate">
              {event.location}
            </p>
          </div>

          <div className="glass p-5 rounded-[22px] space-y-1">
            <div className="flex items-center gap-2.5 text-foreground/80 mb-1">
              <Users className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Community
              </p>
            </div>
            <p className="text-[15px] font-semibold text-foreground">
              {event.participants || 0} {event.participants === 1 ? "Volunteer" : "Volunteers"} Joined
            </p>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-3 pt-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            About This Social Initiative
          </h2>
          <div className="rounded-[28px] glass p-6 md:p-8 space-y-4 text-foreground/90 leading-relaxed whitespace-pre-line text-[15px] sm:text-base">
            {event.description}
          </div>
        </div>

        {/* Volunteer Notice in Glass Panel */}
        <div className="rounded-[24px] glass p-5 flex items-start gap-3.5">
          <Clock className="h-5 w-5 text-foreground/70 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-[13px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              Preparation Guidelines for Volunteers
            </p>
            <p>
              Please arrive 15 minutes before the scheduled time. Wear comfortable clothing suitable for
              community service, bring a water bottle, and verify the landmark ahead of time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
