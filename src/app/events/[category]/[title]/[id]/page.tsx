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
  Star,
  ChevronDown,
  ChevronUp,
  Phone,
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
import { PrivateRoute } from "@/components/auth/private-route";
import { JoinBurstEffect } from "@/components/events/join-burst";
import { useSession } from "@/lib/auth-client";
import {
  apiFetch,
  getCachedData,
  invalidateCache,
  type EventItem,
  ClientApiError,
} from "@/lib/api";
import { formatDate, getHighResImageUrl, cn, formatCompactNumber, formatPhoneNumberDisplay } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80";

const getJoinStorageKey = (id: string, email?: string | null) =>
  email
    ? `hatey_hat_joined_${email.toLowerCase().trim()}_${id}`
    : `hatey_hat_joined_${id}`;

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const category = params.category as string | undefined;
  const title = params.title as string | undefined;
  const eventId = category && title && rawId ? `${category}/${title}/${rawId}` : rawId;
  const { data: session } = useSession();

  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [isPast, setIsPast] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isJoining, setIsJoining] = React.useState(false);
  const isJoiningRef = React.useRef(false);
  const initialCheckDoneRef = React.useRef(false);
  const [hasJoined, setHasJoined] = React.useState(false);
  const [showBurst, setShowBurst] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imgSrc, setImgSrc] = React.useState<string>("");
  const [isRatingFactorOpen, setIsRatingFactorOpen] = React.useState(false);

  const currentUserEmail = session?.user?.email;
  const isCreator = Boolean(
    currentUserEmail &&
      event?.creatorEmail &&
      currentUserEmail.toLowerCase().trim() === event.creatorEmail.toLowerCase().trim()
  );

  // 1. Immediately read persistent join state on mount so page reload/tab re-open is instantaneous
  React.useEffect(() => {
    if (typeof window !== "undefined" && eventId) {
      const email = currentUserEmail;
      const isSaved =
        localStorage.getItem(`hatey_hat_joined_${eventId}`) === "true" ||
        (event?._id ? localStorage.getItem(`hatey_hat_joined_${event._id}`) === "true" : false) ||
        (email ? localStorage.getItem(getJoinStorageKey(eventId, email)) === "true" : false) ||
        (email && event?._id ? localStorage.getItem(getJoinStorageKey(event._id, email)) === "true" : false);
      if (isSaved) {
        setHasJoined(true);
      }
    }
  }, [eventId, event?._id, currentUserEmail]);

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
      // Fetch fresh participant count, details, and join status directly from API
      const res = await apiFetch<EventItem>(`/api/events/${eventId}`, {
        auth: true,
        skipCache: true,
      });
      setEvent(res.data);

      if (typeof res.data?.hasJoined === "boolean") {
        setHasJoined(res.data.hasJoined);
        if (typeof window !== "undefined") {
          const email = currentUserEmail;
          if (res.data.hasJoined) {
            localStorage.setItem(`hatey_hat_joined_${eventId}`, "true");
            localStorage.setItem(`hatey_hat_joined_${res.data._id}`, "true");
            if (email) {
              localStorage.setItem(getJoinStorageKey(eventId, email), "true");
              localStorage.setItem(getJoinStorageKey(res.data._id, email), "true");
            }
          }
        }
      }

      if (res.data?.slug && typeof window !== "undefined") {
        const canonical = `/events/${res.data.slug}`;
        if (
          window.location.pathname !== canonical &&
          !window.location.pathname.endsWith("/edit") &&
          !window.location.pathname.endsWith("/participants")
        ) {
          window.history.replaceState(null, "", canonical);
        }
      }
      const eventTime = new Date(res.data.eventDate).getTime();
      setIsPast(eventTime + 24 * 60 * 60 * 1000 <= Date.now());
      setImgSrc(getHighResImageUrl(res.data.thumbnail) || FALLBACK_IMAGE);
    } catch (err: any) {
      setError(err?.message || "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, currentUserEmail]);

  // Check if current user has already joined in database
  const checkJoinStatus = React.useCallback(
    async (targetEvent?: EventItem | null) => {
      if (!session?.user || !eventId || isJoiningRef.current) return;
      const currentEvent = targetEvent || event;
      try {
        const res = await apiFetch<any[]>("/api/joins/my", {
          auth: true,
          skipCache: true,
        });

        const targetId = currentEvent?._id ? String(currentEvent._id) : "";
        const targetSlug = currentEvent?.slug || eventId;
        const targetTitle = (currentEvent?.title || "").trim().toLowerCase();

        const alreadyJoined = res.data?.some((j: any) => {
          const jId = String(j.eventId?._id || j.eventId?.$oid || j.eventId || "");
          const jSlug = String(j.eventSlug || "");
          const jTitle = String(j.eventTitle || "").trim().toLowerCase();

          return (
            (targetId && jId === targetId) ||
            (targetSlug && (jId === targetSlug || jSlug === targetSlug)) ||
            (targetTitle && jTitle === targetTitle)
          );
        });

        if (alreadyJoined) {
          setHasJoined(true);
          if (typeof window !== "undefined") {
            localStorage.setItem(`hatey_hat_joined_${eventId}`, "true");
            if (targetId) localStorage.setItem(`hatey_hat_joined_${targetId}`, "true");
            if (session.user.email) {
              localStorage.setItem(getJoinStorageKey(eventId, session.user.email), "true");
              if (targetId) {
                localStorage.setItem(getJoinStorageKey(targetId, session.user.email), "true");
              }
            }
          }
        } else if (!isJoiningRef.current && currentEvent && res.data && Array.isArray(res.data)) {
          // If server successfully returned joins list and user is not currently in a join transaction
          setHasJoined(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem(`hatey_hat_joined_${eventId}`);
            if (targetId) localStorage.removeItem(`hatey_hat_joined_${targetId}`);
            if (session.user.email) {
              localStorage.removeItem(getJoinStorageKey(eventId, session.user.email));
              if (targetId) {
                localStorage.removeItem(getJoinStorageKey(targetId, session.user.email));
              }
            }
          }
        }
      } catch {
        // Ignore join check failure (keep local cached state)
      }
    },
    [session, eventId, event]
  );

  React.useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  React.useEffect(() => {
    if (event && !initialCheckDoneRef.current) {
      initialCheckDoneRef.current = true;
      checkJoinStatus(event);
    }
  }, [event, checkJoinStatus]);

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

    if (isCreator) {
      toast.error("You organized this event and cannot join it.");
      return;
    }

    if (hasJoined || isJoining || isJoiningRef.current) return;

    // 1. Instantaneous Optimistic UI Update (0ms delay - identical to YouTube Like)
    isJoiningRef.current = true;
    setIsJoining(true);
    setHasJoined(true);
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1400);

    // Save to persistent storage immediately with both slug and ObjectId
    if (typeof window !== "undefined") {
      localStorage.setItem(`hatey_hat_joined_${eventId}`, "true");
      if (event?._id) {
        localStorage.setItem(`hatey_hat_joined_${event._id}`, "true");
      }
      if (session.user.email) {
        localStorage.setItem(
          getJoinStorageKey(eventId, session.user.email),
          "true"
        );
        if (event?._id) {
          localStorage.setItem(
            getJoinStorageKey(event._id, session.user.email),
            "true"
          );
        }
      }
    }

    setEvent((prev) =>
      prev
        ? {
            ...prev,
            hasJoined: true,
            participants: (prev.participants || 0) + 1,
          }
        : null
    );

    // 2. Perform network sync in background
    try {
      const res = await apiFetch(`/api/events/${eventId}/join`, {
        method: "POST",
        auth: true,
      });

      setHasJoined(true);

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
        setHasJoined(true);
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
                hasJoined: false,
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
      isJoiningRef.current = false;
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

  return (
    <PrivateRoute>
      {isLoading ? (
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
      ) : error || !event ? (
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
      ) : (
        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 max-w-4xl space-y-8">
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

      {/* Hero Banner Image in Glass Container - Seamless Full-Width Showcase */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-[28px] glass p-2 shadow-sm bg-neutral-950">
        <div className="w-full h-full overflow-hidden rounded-[22px] relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={event.title}
            className="w-full h-full object-cover object-center rounded-[22px] select-none [image-rendering:-webkit-optimize-contrast]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide text-white bg-black/60 backdrop-blur-md border border-white/20 shadow-xs">
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
              <Link href={`/events/${event?.slug || event?._id || eventId}/participants`}>
                <FileText className="h-4 w-4" />
                <span>Volunteers Roster & PDF</span>
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
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex items-center flex-wrap gap-2">
                  <User className="h-4 w-4 text-foreground/70 shrink-0" />
                  <span>
                    Organized by{" "}
                    <strong className="text-foreground font-semibold">
                      {event.creatorName}
                    </strong>{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({Boolean(event.organization && event.organization.trim()) ? "Organization" : "Organizer"})
                    </span>
                  </span>
                  {event.creatorPhone ? (
                    <span className="text-xs font-mono text-muted-foreground inline-flex items-center gap-1 bg-foreground/5 px-2.5 py-0.5 rounded-full border border-foreground/10">
                      <Phone className="h-3 w-3 text-emerald-500" />
                      <span>({formatPhoneNumberDisplay(event.creatorPhone)})</span>
                    </span>
                  ) : event.creatorEmail ? (
                    <span className="text-xs text-muted-foreground">({event.creatorEmail})</span>
                  ) : null}
                </p>

                {/* Organizer Star Rating Badge */}
                {isCreator ? (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow-xs"
                    title={`Your Organizer Score: ${Math.min(5.0, Math.max(0.0, event.organizerRating ?? 5.0)).toFixed(1)} / 5.0 (${event.organizerConcludedEvents ?? 0} events concluded)`}
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-foreground">
                      {Math.min(5.0, Math.max(0.0, event.organizerRating ?? 5.0)).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({event.organizerConcludedEvents ?? 0} concluded)
                    </span>
                  </div>
                ) : (
                  /* External Viewers only see the clean Star Rating */
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25"
                    title={`Organizer Trust Rating: ${Math.min(5.0, Math.max(0.0, event.organizerRating ?? 5.0)).toFixed(1)} / 5.0`}
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{Math.min(5.0, Math.max(0.0, event.organizerRating ?? 5.0)).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Comprehensive Organizer Rating Factor Card (Collapsible, visible to both viewer & organizer) */}
              <div className="glass rounded-2xl p-4 sm:p-5 border border-foreground/10 space-y-3 max-w-2xl bg-foreground/5 mt-1 transition-all">
                <div
                  onClick={() => setIsRatingFactorOpen((prev) => !prev)}
                  className="flex items-center justify-between gap-2 cursor-pointer select-none group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsRatingFactorOpen((prev) => !prev);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
                      Organizer Trust &amp; Reliability Rating Factor
                    </span>
                  </div>
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-transform">
                    {isRatingFactorOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Collapsible Content: Expands on click */}
                {isRatingFactorOpen && (
                  <div className="pt-2 border-t border-foreground/10 space-y-3 animate-in fade-in-50 duration-200">
                    {/* Active Status & Reason: Personal formula breakdown visible only to organizer; high-level trust overview for viewers */}
                    <div className="space-y-1">
                      <p className="text-xs text-foreground font-medium leading-relaxed">
                        {isCreator
                          ? (event.organizerRatingReason ||
                              "Your community rating is calculated from concluded on-time events vs early cancellations.")
                          : "Community trust rating is calculated based on successfully concluded on-time events versus early cancellations."}
                      </p>
                    </div>

                    {/* 4-Pillar Transparent Rating System Guide */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
                      <div className="p-2.5 rounded-xl bg-background/50 border border-foreground/5 space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          5.0 Base Trust &amp; Clean Standing
                        </span>
                        <p className="leading-normal">
                          Every clean organizer starts with 5.0 stars. Each event concluded on schedule confirms community trust.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-background/50 border border-foreground/5 space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          Cancellations &amp; Strike Penalty
                        </span>
                        <p className="leading-normal">
                          Deleting events early deducts -0.5 points per cancellation strike. 3 early strikes results in event creation suspension.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-background/50 border border-foreground/5 space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          Concluded Events Boost (+0.3 ★)
                        </span>
                        <p className="leading-normal">
                          Reinstated organizers start at 2.5 ★ (or 2.0 ★ base) and earn +0.3 ★ for each on-time concluded event up to 5.0 ★.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-background/50 border border-foreground/5 space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                          2-Month Ban &amp; 1-Month Appeal
                        </span>
                        <p className="leading-normal">
                          2 cancellations during probation triggers a 2-month ban. Early appeal unlocks after 1 month (resumes at 2.5 ★); full auto-unban activates at 2 months (resumes at 2.0 ★).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isCreator && (
              <Button
                asChild
                className="gap-2 rounded-full h-11 px-6 font-medium shadow-xs cursor-pointer"
              >
                <Link href={`/events/${event?.slug || event?._id || eventId}/edit`}>
                  <Edit className="h-4 w-4" />
                  <span>Edit Event</span>
                </Link>
              </Button>
            )}

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

            {!isCreator && (
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

        {/* Volunteer Notice in Glass Panel (Only visible to prospective volunteers / visitors) */}
        {!isCreator && (
          <div className="rounded-[24px] glass p-5 flex items-start gap-3.5">
            <Clock className="h-5 w-5 text-foreground/70 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-[13px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                Preparation Guidelines for Volunteers
              </p>
              <p>
                Please arrive 30 minutes before the scheduled time. Wear
                comfortable clothing suitable for community service, bring a water
                bottle, and verify the landmark ahead of time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    )}
    </PrivateRoute>
  );
}
