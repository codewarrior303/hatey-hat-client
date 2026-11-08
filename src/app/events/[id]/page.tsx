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
  FileText,
  Edit,
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
import { JoinBurstEffect } from "@/components/events/join-burst";
import { useSession } from "@/lib/auth-client";
import {
  apiFetch,
  getCachedData,
  invalidateCache,
  type EventItem,
  ClientApiError,
} from "@/lib/api";
import { formatDate, getHighResImageUrl, cn, formatCompactNumber } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80";

const getJoinStorageKey = (id: string, email?: string | null) =>
  email
    ? `hatey_hat_joined_${email.toLowerCase().trim()}_${id}`
    : `hatey_hat_joined_${id}`;

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
  const [showBurst, setShowBurst] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imgSrc, setImgSrc] = React.useState<string>("");

  const isCreator = Boolean(
    session?.user?.email &&
      event?.creatorEmail &&
      session.user.email.toLowerCase() === event.creatorEmail.toLowerCase()
  );

  // 1. Immediately read persistent join state on mount so page reload/tab re-open is instantaneous
  React.useEffect(() => {
    if (typeof window !== "undefined" && eventId) {
      const email = session?.user?.email;
      const isSaved =
        localStorage.getItem(`hatey_hat_joined_${eventId}`) === "true" ||
        (email ? localStorage.getItem(getJoinStorageKey(eventId, email)) === "true" : false);
      if (isSaved) {
        setHasJoined(true);
      }
    }
  }, [eventId, session?.user?.email]);

  const fetchEvent = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const cached =
        typeof window !== "undefined"
          ? getCachedData<EventItem>(`/api/events/${eventId}`)
          : null;
      if (!cached) {
        setIsLoading(true);
      }
      setError(null);
      // Fetch fresh participant count and event details directly from API
      const res = await apiFetch<EventItem>(`/api/events/${eventId}`, {
        skipCache: true,
      });
      setEvent(res.data);
      setIsPast(new Date(res.data.eventDate).getTime() <= Date.now());
      setImgSrc(getHighResImageUrl(res.data.thumbnail) || FALLBACK_IMAGE);
    } catch (err: any) {
      setError(err?.message || "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Check if current user has already joined in database
  const checkJoinStatus = React.useCallback(async () => {
    if (!session?.user || !eventId) return;
    try {
      const res = await apiFetch<any[]>("/api/joins/my", {
        auth: true,
        skipCache: true,
      });
      const alreadyJoined = res.data?.some((j: any) => {
        const jId = String(j.eventId?._id || j.eventId?.$oid || j.eventId || "");
        return jId === String(eventId);
      });

      if (alreadyJoined) {
        setHasJoined(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(`hatey_hat_joined_${eventId}`, "true");
          if (session.user.email) {
            localStorage.setItem(
              getJoinStorageKey(eventId, session.user.email),
              "true"
            );
          }
        }
      } else if (res.data && Array.isArray(res.data)) {
        // If server successfully returned joins list and event is not in it, sync local state
        setHasJoined(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`hatey_hat_joined_${eventId}`);
          if (session.user.email) {
            localStorage.removeItem(
              getJoinStorageKey(eventId, session.user.email)
            );
          }
        }
      }
    } catch {
      // Ignore join check failure (keep local cached state)
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
      router.push(
        `/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`,
      );
      return;
    }

    if (hasJoined || isJoining) return;

    // 1. Instantaneous Optimistic UI Update (0ms delay - identical to YouTube Like)
    setHasJoined(true);
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1400);

    // Save to persistent storage immediately
    if (typeof window !== "undefined") {
      localStorage.setItem(`hatey_hat_joined_${eventId}`, "true");
      if (session.user.email) {
        localStorage.setItem(
          getJoinStorageKey(eventId, session.user.email),
          "true"
        );
      }
    }

    setEvent((prev) =>
      prev
        ? {
            ...prev,
            participants: (prev.participants || 0) + 1,
          }
        : null
    );

    // 2. Perform network sync in background
    setIsJoining(true);
    try {
      const res = await apiFetch(`/api/events/${eventId}/join`, {
        method: "POST",
        auth: true,
      });

      // Invalidate relevant event and joins caches
      invalidateCache(`/api/events/${eventId}`);
      invalidateCache("/api/events");
      invalidateCache("/api/joins");
      invalidateCache("/api/stats");

      toast.success(
        res.message ||
          "You have successfully joined this event! See you there.",
        { id: "join-success" }
      );
    } catch (err: any) {
      if (err instanceof ClientApiError && err.statusCode === 409) {
        // Already registered on server, keep optimistic state
        toast.success(
          "You are already registered for this event. See you there!",
          { id: "join-success" }
        );
      } else {
        // Rollback optimistic state on genuine error
        setHasJoined(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`hatey_hat_joined_${eventId}`);
          if (session.user.email) {
            localStorage.removeItem(
              getJoinStorageKey(eventId, session.user.email)
            );
          }
        }
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                participants: Math.max(0, (prev.participants || 1) - 1),
              }
            : null
        );
        toast.error(
          err?.message || "Could not join this event. Please try again.",
          { id: "join-error" }
        );
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!", {
        id: "clipboard-copy",
      });
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
      <div className="relative aspect-[16/10] w-full max-h-[520px] overflow-hidden rounded-[28px] glass p-2 shadow-sm">
        <div className="w-full h-full overflow-hidden rounded-[22px] bg-neutral-100 dark:bg-neutral-900 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={event.title}
            className="h-full w-full object-cover object-top select-none [image-rendering:-webkit-optimize-contrast] contrast-[1.01]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
              {event.eventType}
            </span>
            {isPast && (
              <Badge
                variant="destructive"
                className="font-semibold rounded-full"
              >
                Concluded
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Organizer Control Banner (Only visible to event creator) */}
      {isCreator && (
        <div className="rounded-[24px] glass p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-foreground/15 shadow-xs bg-foreground/[0.03]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Organizer Controls</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              You organized this event. Access the live volunteer roster & export attendance reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              asChild
              className="gap-2 rounded-full h-10 px-5 text-xs sm:text-sm font-medium shadow-xs"
            >
              <Link href={`/events/${eventId}/participants`}>
                <FileText className="h-4 w-4" />
                <span>Volunteers Roster & PDF</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full h-10 px-4 text-xs sm:text-sm font-medium glass"
            >
              <Link href={`/events/${eventId}/edit`}>
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Event</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Title & Metadata */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-foreground/10">
          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
              {event.title}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 text-foreground/70 shrink-0" />
              <span>
                Organized by{" "}
                <strong className="text-foreground font-semibold">
                  {event.creatorName}
                </strong>
              </span>
              <span className="text-xs">({event.creatorEmail})</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Live Total Joined Counter Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-foreground/15 text-xs sm:text-sm font-medium text-foreground select-none shadow-2xs">
              <Users className="h-4 w-4 text-foreground/70 shrink-0" />
              <span>
                <strong className="font-semibold text-foreground">
                  {formatCompactNumber(event.participants || 0)}
                </strong>{" "}
                {(event.participants || 0) === 1
                  ? "Volunteer Joined"
                  : "Volunteers Joined"}
              </span>
            </div>

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

            <div className="relative inline-flex">
              <JoinBurstEffect active={showBurst} />

              {hasJoined ? (
                <Button
                  variant="secondary"
                  size="lg"
                  className={cn(
                    "gap-2 font-medium rounded-full h-11 px-6 glass bg-foreground/10 text-foreground cursor-default transition-all duration-300",
                    showBurst && "animate-yt-pop"
                  )}
                  disabled
                >
                  <CheckCircle2
                    className={cn(
                      "h-4 w-4 text-foreground transition-transform",
                      showBurst && "animate-yt-pop"
                    )}
                  />
                  <span>You Have Joined</span>
                </Button>
              ) : isPast ? (
                <Button
                  variant="outline"
                  size="lg"
                  disabled
                  className="gap-2 rounded-full h-11 px-6"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Past Event</span>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleJoinEvent}
                  disabled={isJoining}
                  className="relative gap-2 font-medium rounded-full h-11 px-7 shadow-sm transition-transform active:scale-95"
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
              {formatCompactNumber(event.participants || 0)}{" "}
              {event.participants === 1 ? "Volunteer" : "Volunteers"} Joined
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
              Please arrive 15 minutes before the scheduled time. Wear
              comfortable clothing suitable for community service, bring a water
              bottle, and verify the landmark ahead of time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
