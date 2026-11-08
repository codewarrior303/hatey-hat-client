"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  Send,
  MapPin,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BellOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/events/event-card";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  apiFetch,
  getCachedData,
  setCachedData,
  invalidateCache,
  type EventItem,
  type EventType,
} from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface StatsSummary {
  upcomingEvents: number;
  totalJoins: number;
  categoriesCount: number;
  locationsCount: number;
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [stats, setStats] = React.useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterError, setNewsletterError] = React.useState<string | null>(
    null,
  );
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = React.useState(false);
  const [isSubscribed, setIsSubscribed] = React.useState<boolean>(false);
  const [persistedSubEmail, setPersistedSubEmail] = React.useState<string | null>(null);

  // Community in Action Carousel State
  const [isAtStart, setIsAtStart] = React.useState(true);
  const [isAtEnd, setIsAtEnd] = React.useState(false);
  const actionsScrollRef = React.useRef<HTMLDivElement>(null);

  const updateScrollState = React.useCallback(() => {
    const container = actionsScrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setIsAtStart(scrollLeft <= 8);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 12);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const container = actionsScrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollState, { passive: true });
    }
    window.addEventListener("resize", updateScrollState);
    return () => {
      if (container) container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const handlePrevAction = () => {
    const container = actionsScrollRef.current;
    if (!container) return;
    const firstChild = container.firstElementChild as HTMLElement | null;
    const step = firstChild ? firstChild.offsetWidth + 24 : 360;
    container.scrollBy({ left: -step, behavior: "smooth" });
    setTimeout(updateScrollState, 350);
  };

  const handleNextAction = () => {
    const container = actionsScrollRef.current;
    if (!container) return;
    const firstChild = container.firstElementChild as HTMLElement | null;
    const step = firstChild ? firstChild.offsetWidth + 24 : 360;
    container.scrollBy({ left: step, behavior: "smooth" });
    setTimeout(updateScrollState, 350);
  };

  // Storage key helper for persisting subscription across reloads and tab closures
  const getSubKey = React.useCallback(
    (email?: string | null) => (email ? `hatey_hat_sub_${email.toLowerCase().trim()}` : null),
    []
  );

  // 1. Immediately read persistent state on client mount so page reload/tab re-open is instantaneous
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("hatey_hat_sub_email");
      if (savedEmail) {
        setPersistedSubEmail(savedEmail);
        setIsSubscribed(true);
      }
    }
  }, []);

  // Sync subscription status with local cache and MongoDB database
  const checkSubscriberStatus = React.useCallback(async () => {
    const activeEmail = user?.email || persistedSubEmail;
    if (!activeEmail) {
      return;
    }

    const storageKey = getSubKey(activeEmail);
    // Read persistent state from localStorage so page reload/tab re-open is instantaneous
    if (typeof window !== "undefined") {
      const saved = storageKey ? localStorage.getItem(storageKey) : null;
      const globalSaved = localStorage.getItem("hatey_hat_sub_email");
      if (saved === "true" || (globalSaved && globalSaved.toLowerCase() === activeEmail.toLowerCase())) {
        setIsSubscribed(true);
        if (!persistedSubEmail) {
          setPersistedSubEmail(activeEmail);
        }
      }
    }

    // Authoritative check with database (supports optional JWT & email query param)
    try {
      const queryParam = `?email=${encodeURIComponent(activeEmail.toLowerCase())}`;
      const res = await apiFetch<{ isSubscribed: boolean; email: string }>(
        `/api/subscribers/status${queryParam}`,
        { auth: true, skipCache: true }
      );
      const isSub = Boolean(
        (res?.data as any)?.isSubscribed ?? (res as any)?.isSubscribed
      );
      setIsSubscribed(isSub);
      if (typeof window !== "undefined") {
        if (isSub) {
          if (storageKey) localStorage.setItem(storageKey, "true");
          localStorage.setItem("hatey_hat_sub_email", activeEmail.toLowerCase());
          setPersistedSubEmail(activeEmail);
        } else {
          if (storageKey) localStorage.removeItem(storageKey);
          if (localStorage.getItem("hatey_hat_sub_email") === activeEmail.toLowerCase()) {
            localStorage.removeItem("hatey_hat_sub_email");
          }
          setPersistedSubEmail(null);
        }
      }
    } catch {
      // Retain existing client state if network glitch
    }
  }, [user?.email, persistedSubEmail, getSubKey]);

  React.useEffect(() => {
    checkSubscriberStatus();
  }, [checkSubscriberStatus]);

  const fetchRecentEvents = React.useCallback(async () => {
    try {
      const cached =
        typeof window !== "undefined"
          ? getCachedData<EventItem[]>("/api/events?limit=6")
          : null;
      if (cached && cached.length > 0) {
        setEvents(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const [eventsRes, statsRes] = await Promise.allSettled([
        apiFetch<EventItem[]>("/api/events?limit=6", { skipCache: true }),
        apiFetch<StatsSummary>("/api/events/stats/summary", { skipCache: true }),
      ]);

      if (eventsRes.status === "fulfilled") {
        const freshEvents = eventsRes.value.data || [];
        setEvents(freshEvents);
        if (typeof window !== "undefined") {
          setCachedData("/api/events?limit=6", freshEvents);
        }
      } else {
        setError(eventsRes.reason?.message || "Failed to load recent events");
      }

      if (statsRes.status === "fulfilled" && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load recent events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRecentEvents();
  }, [fetchRecentEvents]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // User must be logged in to subscribe
    if (!user) {
      toast.error("Please sign in to subscribe to community updates.", {
        id: "newsletter-login-required",
      });
      router.push("/login");
      return;
    }

    setNewsletterError(null);
    setIsSubscribing(true);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        "/api/subscribers",
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({ email: user.email }),
          headers: { "Content-Type": "application/json" },
        },
      );
      toast.success(
        res.message || "Thank you for subscribing to community updates!",
        { id: "newsletter-subscribed" }
      );
      setIsSubscribed(true);
      setPersistedSubEmail(user.email);
      const storageKey = getSubKey(user.email);
      if (typeof window !== "undefined") {
        if (storageKey) localStorage.setItem(storageKey, "true");
        localStorage.setItem("hatey_hat_sub_email", user.email.toLowerCase());
      }
      setNewsletterEmail("");
    } catch (err: any) {
      const msg =
        err?.message || "Could not subscribe at this time. Please try again.";
      setNewsletterError(msg);
      toast.error(msg, { id: "newsletter-error" });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    const activeEmail = user?.email || persistedSubEmail;
    setIsUnsubscribing(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        "/api/subscribers/unsubscribe",
        {
          method: "POST",
          auth: true,
          body: activeEmail ? JSON.stringify({ email: activeEmail }) : undefined,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(
        res.message || "You have been unsubscribed from community updates.",
        { id: "newsletter-unsubscribed" }
      );
      setIsSubscribed(false);
      setPersistedSubEmail(null);
      if (typeof window !== "undefined") {
        if (activeEmail) {
          const storageKey = getSubKey(activeEmail);
          if (storageKey) localStorage.removeItem(storageKey);
        }
        localStorage.removeItem("hatey_hat_sub_email");
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not unsubscribe at this time.", {
        id: "newsletter-unsub-error",
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  // Authentic photographs and initiatives across all 10 social action and disaster relief categories
  const communityActions: {
    eventType: EventType;
    title: string;
    description: string;
    image: string;
  }[] = [
    {
      eventType: "Flood & Disaster Relief",
      title: "Flood & Disaster Relief",
      description:
        "Emergency boat rescue, dry rations, and clean drinking water for flood-affected families in Feni, Sylhet & Noakhali.",
      image: "/community/flood-relief.jpg",
    },
    {
      eventType: "Emergency Response",
      title: "Emergency Response",
      description:
        "Rapid volunteer rescue teams navigating floodwaters to evacuate stranded families from submerged houses.",
      image: "/community/emergency-response.jpg",
    },
    {
      eventType: "Winter Relief",
      title: "Winter Relief",
      description:
        "Distributing thick blankets and warm garments to elderly citizens and smiling children across northern Bangladesh.",
      image: "/community/winter-relief.jpg",
    },
    {
      eventType: "Food Distribution",
      title: "Food Distribution",
      description:
        "Essential grocery rations and food packages distributed in organized community rows for families in crisis.",
      image: "/community/food-distribution.jpg",
    },
    {
      eventType: "Health Camp",
      title: "Health Camp",
      description:
        "Free physician consultations, diagnostic checkups, essential medicines, and medical care for vulnerable communities.",
      image: "/community/health-camp.jpg",
    },
    {
      eventType: "Blood Donation",
      title: "Blood Donation",
      description:
        "Voluntary blood donor drives connecting verified local donors with hospital patients requiring critical transfusions.",
      image:
        "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80",
    },
    {
      eventType: "Cleanup",
      title: "Cleanup",
      description:
        "Youth-led civic environmental drives removing plastic waste from riverbanks, park trails, and neighbourhood quarters.",
      image:
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
    },
    {
      eventType: "Plantation",
      title: "Plantation",
      description:
        "Planting native trees, fruit saplings, and urban forestry to restore greenery and build climate resilience across Bangladesh.",
      image:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    },
    {
      eventType: "Education",
      title: "Education",
      description:
        "Free learning sessions, stationery kits, and peer mentorship for underprivileged school kids and street children.",
      image:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
    },
    {
      eventType: "Donation",
      title: "Donation",
      description:
        "Crowdfunded transparent financial assistance and emergency grants for medical treatments, shelter repairs, and livelihoods.",
      image:
        "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const features = [
    {
      icon: HeartHandshake,
      title: "Disaster & Emergency Relief",
      description:
        "Mobilize rapid community response during floods, cyclones, and urgent crises with coordinated volunteer boots on the ground.",
    },
    {
      icon: MapPin,
      title: "Hyper-Local Initiatives",
      description:
        "Find relief camps, clothing drives, cleanups, blood donation, and health camps happening directly in your neighbourhood across Bangladesh.",
    },
    {
      icon: PlusCircle,
      title: "Community Event Creation",
      description:
        "Have a cause or emergency? Launch a flood relief campaign, neighbourhood cleanup, or food drive with transparent schedules.",
    },
    {
      icon: ShieldCheck,
      title: "Transparent Coordination",
      description:
        "Clear organizer ownership, real-time participant counts, and authentic community accountability on every event page.",
    },
  ];

  return (
    <div className="flex flex-col space-y-24 md:space-y-32 pb-24">
      {/* 1. HERO / BANNER SECTION (APPLE AESTHETIC - INSTANTLY VISIBLE) */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6">
        <div className="container relative mx-auto text-center max-w-4xl space-y-8 animate-in fade-in-50 duration-500">
          {/* Subtle Tagline Pill */}
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs sm:text-[13px] font-medium text-foreground/80 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 opacity-60" />
            <span>Hatey Hat, ekshathe poth chola</span>
          </div>

          {/* Hero Headline (56-76px on desktop, weight 600, tight tracking) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-[-0.035em] text-foreground leading-[1.08] max-w-4xl mx-auto">
            Unite with your community to build a kinder Bangladesh.
          </h1>

          <p className="text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            The community platform to organize and join disaster relief, emergency
            response, and grassroots social initiatives across Bangladesh.
          </p>

          {/* Pill Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-7 rounded-full font-medium shadow-sm"
            >
              <Link href="/events">
                <span>Explore Events</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-7 rounded-full font-medium glass"
            >
              <Link href="/events/create">
                <PlusCircle className="h-4 w-4" />
                <span>Organize an Initiative</span>
              </Link>
            </Button>
          </div>

          {/* Real Database Impact Snapshot (Honest Numbers) */}
          <div className="glass max-w-3xl mx-auto p-6 sm:p-8 rounded-[28px] mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-xs">
            <div className="space-y-1">
              <p
                suppressHydrationWarning
                className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
              >
                {stats ? `${stats.upcomingEvents}` : "10+"}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Upcoming Events
              </p>
            </div>
            <div className="space-y-1">
              <p
                suppressHydrationWarning
                className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
              >
                {stats ? `${stats.totalJoins}` : "Active"}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Volunteers Joined
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Free
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Open to Everyone
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Bangladesh
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Grassroots & Nationwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RECENT UPCOMING EVENTS (DYNAMIC, SCROLL REVEALED) */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal direction="up" delay={50}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Get Involved
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Upcoming Initiatives
              </h2>
              <p className="text-[15px] text-muted-foreground">
                Social service drives happening across communities in Bangladesh.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="gap-2 shrink-0 self-start sm:self-auto glass rounded-full"
            >
              <Link href="/events">
                <span>View All Events</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <EventGridSkeleton count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecentEvents} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No Upcoming Events Right Now"
            description="Be the first neighbour to organize a local drive, cleanup, or aid distribution in your area."
            actionHref="/events/create"
            actionLabel="Create an Event"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, idx) => (
              <ScrollReveal key={event._id} delay={idx * 75} direction="up">
                <EventCard event={event} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* 3. FEATURES SECTION (4 GLASS CARDS, STAGGERED SCROLL REVEAL) */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal direction="up" delay={50}>
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Platform Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Built for Community Action
            </h2>
            <p className="text-[15px] text-muted-foreground">
              Simple, honest tools to turn community goodwill into organized
              neighbourhood support.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 90} direction="up">
                <div className="glass glass-card flex flex-col justify-between p-6 rounded-[24px] h-full">
                  <div className="space-y-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-[17px] font-semibold text-foreground leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 4. GALLERY & CATEGORIES CAROUSEL ("COMMUNITY IN ACTION", 10 INITIATIVES WITH CONTROLS) */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal direction="up" delay={50}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                On The Ground
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Community in Action
              </h2>
              <p className="text-[15px] text-muted-foreground">
                Grassroots initiatives and emergency response drives across Bangladesh.
              </p>
            </div>

            {/* Top Carousel Navigation: Only < > with start/end disabled */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePrevAction}
                disabled={isAtStart}
                className="h-10 w-10 rounded-full glass border-foreground/15 hover:bg-foreground/10 transition-colors shadow-2xs disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous initiatives"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleNextAction}
                disabled={isAtEnd}
                className="h-10 w-10 rounded-full glass border-foreground/15 hover:bg-foreground/10 transition-colors shadow-2xs disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next initiatives"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Carousel Viewport with Snap Scrolling and Exact Grid Widths (no right cutoff) */}
        <div
          ref={actionsScrollRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 px-0.5 scroll-smooth snap-x snap-mandatory no-scrollbar"
        >
          {communityActions.map((action) => (
            <div
              key={action.eventType}
              className="relative flex flex-col justify-between overflow-hidden rounded-[24px] glass glass-card p-3 transition-all duration-300 w-[86vw] sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] shrink-0 snap-start select-none"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={action.image}
                    alt={action.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
                      {action.eventType}
                    </span>
                  </div>
                </div>

                <div className="p-3 pt-3.5 space-y-1.5">
                  <h3 className="text-[17px] font-semibold text-foreground leading-snug">
                    {action.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NEWSLETTER SECTION (WIDE GLASS PANEL WITH CUSTOM TOOLTIP) */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6">
        <ScrollReveal direction="up" delay={80}>
          <div className="rounded-[32px] glass p-8 sm:p-14 text-center space-y-6 shadow-xs">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background mx-auto shadow-xs">
              <Send className="h-5 w-5" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Stay in the community loop.
              </h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Get weekly updates on upcoming relief drives, cleanups, and
                local volunteer initiatives across Bangladesh.
              </p>
            </div>

            {isSubscribed && (user?.email || persistedSubEmail) ? (
              /* State 1: Active Subscription Display with Unsubscribe Action */
              <div className="pt-2 animate-in fade-in-50 duration-300 max-w-xl sm:max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl glass border border-foreground/15 bg-foreground/5 shadow-xs text-left w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        Subscribed to Community Updates
                      </p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground break-all sm:break-normal">
                        Weekly updates delivered to{" "}
                        <strong className="text-foreground font-semibold">
                          {user?.email || persistedSubEmail}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUnsubscribing}
                    onClick={handleUnsubscribe}
                    className="rounded-full h-10 px-5 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/25 transition-all cursor-pointer shadow-xs shrink-0 self-center sm:self-auto active:scale-95 gap-1.5"
                  >
                    <BellOff className="h-3.5 w-3.5" />
                    <span>{isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}</span>
                  </Button>
                </div>
              </div>
            ) : user ? (
              /* State 2: Logged-in User Ready to Subscribe with Verified Account Email */
              <form
                noValidate
                onSubmit={handleNewsletterSubmit}
                className="relative flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2 animate-in fade-in-50"
              >
                <div className="relative w-full sm:w-auto flex-1">
                  <Input
                    type="email"
                    value={user.email}
                    readOnly
                    disabled={isSubscribing}
                    className="h-12 rounded-full px-5 glass bg-foreground/5 border-foreground/15 text-foreground text-sm w-full cursor-default font-medium select-none"
                    aria-label="Your account email address"
                  />
                  {newsletterError && (
                    <div
                      role="alert"
                      className="absolute left-4 -bottom-10 z-30 flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-1.5 text-xs font-medium shadow-xl border border-white/10 dark:border-black/10 animate-in fade-in-0 slide-in-from-top-1 duration-200"
                    >
                      <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-neutral-900 dark:bg-neutral-100" />
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600 shrink-0 relative z-10" />
                      <span className="relative z-10">{newsletterError}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubscribing}
                  className={cn(
                    "w-full sm:w-auto h-12 px-7 rounded-full font-medium shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all gap-2",
                    isSubscribing && "opacity-80 pointer-events-none"
                  )}
                >
                  <span>{isSubscribing ? "Subscribing..." : "Subscribe"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              /* State 3: Visitor Not Logged In -> Login Required */
              <div className="relative flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2 animate-in fade-in-50">
                <div className="relative w-full sm:w-auto flex-1">
                  <Input
                    type="email"
                    maxLength={100}
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="h-12 rounded-full px-5 glass bg-transparent border-foreground/15 text-foreground placeholder:text-muted-foreground text-sm w-full"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    toast.error("Please sign in to subscribe to community updates.", {
                      id: "newsletter-login-required",
                    });
                    router.push("/login");
                  }}
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 rounded-full font-medium shrink-0 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-1">
              No spam. Community updates only. Unsubscribe anytime.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
