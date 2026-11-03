"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  Send,
  MapPin,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/events/event-card";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { apiFetch, type EventItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StatsSummary {
  upcomingEvents: number;
  totalJoins: number;
  categoriesCount: number;
  locationsCount: number;
}

export default function HomePage() {
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [stats, setStats] = React.useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Newsletter state with custom validation tooltip
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterError, setNewsletterError] = React.useState<string | null>(null);

  const fetchRecentEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [eventsRes, statsRes] = await Promise.allSettled([
        apiFetch<EventItem[]>("/api/events?limit=6"),
        apiFetch<StatsSummary>("/api/events/stats/summary"),
      ]);

      if (eventsRes.status === "fulfilled") {
        setEvents(eventsRes.value.data || []);
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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();

    if (!trimmed) {
      setNewsletterError("Please fill out this field.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setNewsletterError("Please enter a valid email address.");
      return;
    }

    setNewsletterError(null);
    toast.success("Thank you for subscribing to community updates!");
    setNewsletterEmail("");
  };

  // Neutral "Community in Action" photographs with activity-only captions
  const galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
      alt: "Volunteers organizing and distributing warm clothing to children",
      caption: "Warm Clothing Distribution",
    },
    {
      src: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=800&q=80",
      alt: "Volunteers sorting and packing emergency blankets and essentials",
      caption: "Essential Blanket Supplies",
    },
    {
      src: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
      alt: "Youth volunteers conducting environmental cleanup along the waterfront",
      caption: "Riverside Cleanup Drive",
    },
    {
      src: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      alt: "Carefully planting native saplings in urban park soil",
      caption: "Urban Tree Plantation",
    },
    {
      src: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=800&q=80",
      alt: "Preparing and distributing warm meals for local workers and families",
      caption: "Fresh Community Meals",
    },
    {
      src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80",
      alt: "Volunteers mentoring children with books and learning materials",
      caption: "Youth Learning Circle",
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: "Hyper-Local Initiatives",
      description:
        "Find relief camps, clothing drives, cleanups, and health camps happening directly in your neighbourhood across Dhaka.",
    },
    {
      icon: HeartHandshake,
      title: "One-Click Joining",
      description:
        "Join any community welfare event instantly. View all your active commitments organized in your personal dashboard.",
    },
    {
      icon: PlusCircle,
      title: "Community Event Creation",
      description:
        "Have a cause in mind? Launch a clothes distribution, neighbourhood cleanup, or book drive with transparent schedules.",
    },
    {
      icon: ShieldCheck,
      title: "Transparent Event Details",
      description:
        "Clear organizer ownership, real-time participant counts, and authentic community accountability on every event page.",
    },
  ];

  return (
    <div className="flex flex-col space-y-24 md:space-y-32 pb-24">
      {/* 1. HERO / BANNER SECTION (APPLE AESTHETIC) */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6">
        <div className="container relative mx-auto text-center max-w-4xl space-y-8">
          <ScrollReveal direction="fade" delay={0}>
            {/* Subtle Tagline Pill */}
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs sm:text-[13px] font-medium text-foreground/80 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 opacity-60" />
              <span>Hate hat, ekshathe poth chola</span>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={80}>
            {/* Hero Headline (56-76px on desktop, weight 600, tight tracking) */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-[-0.035em] text-foreground leading-[1.08] max-w-4xl mx-auto">
              Unite with neighbours to build a kinder Dhaka.
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={140}>
            <p className="text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              A community-driven platform to organize, discover, and join grassroots social service
              events — from winter clothes distributions to neighbourhood cleanups.
            </p>
          </ScrollReveal>

          {/* Pill Action Buttons */}
          <ScrollReveal direction="up" delay={180}>
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
          </ScrollReveal>

          {/* Real Database Impact Snapshot (Honest Numbers) */}
          <ScrollReveal direction="up" delay={240}>
            <div className="glass max-w-3xl mx-auto p-6 sm:p-8 rounded-[28px] mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-xs">
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {stats ? `${stats.upcomingEvents}` : "10+"}
                </p>
                <p className="text-xs text-muted-foreground font-medium">Upcoming Events</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {stats ? `${stats.totalJoins}` : "Active"}
                </p>
                <p className="text-xs text-muted-foreground font-medium">Volunteers Joined</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Free
                </p>
                <p className="text-xs text-muted-foreground font-medium">Open to Everyone</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Dhaka
                </p>
                <p className="text-xs text-muted-foreground font-medium">Grassroots & Local</p>
              </div>
            </div>
          </ScrollReveal>
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
                Social service drives happening across Dhaka neighbourhoods.
              </p>
            </div>

            <Button asChild variant="outline" className="gap-2 shrink-0 self-start sm:self-auto glass rounded-full">
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
              Simple, honest tools to turn community goodwill into organized neighbourhood support.
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

      {/* 4. GALLERY SECTION ("COMMUNITY IN ACTION", EQUAL SIZE GLASS CARDS) */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal direction="up" delay={50}>
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              On The Ground
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Community in Action
            </h2>
            <p className="text-[15px] text-muted-foreground">
              A glimpse into solidarity, volunteer teamwork, and grassroots care across Dhaka.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <ScrollReveal key={idx} delay={idx * 60} direction="up">
              <div className="glass glass-card group relative overflow-hidden rounded-[24px] p-2.5 transition-all duration-300">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 pt-3 flex flex-col">
                  <p className="text-[15px] font-semibold text-foreground leading-tight">
                    {img.caption}
                  </p>
                  <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                    {img.alt}
                  </p>
                </div>
              </div>
            </ScrollReveal>
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
                Get weekly updates on upcoming relief drives, cleanups, and local volunteer initiatives
                across Dhaka.
              </p>
            </div>

            <form
              noValidate
              onSubmit={handleNewsletterSubmit}
              className="relative flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2"
            >
              <div className="relative w-full sm:w-auto flex-1">
                <Input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterError) setNewsletterError(null);
                  }}
                  placeholder="Enter your email address"
                  className={cn(
                    "h-12 rounded-full px-5 glass bg-transparent border-foreground/15 text-foreground placeholder:text-muted-foreground text-sm w-full transition-all",
                    newsletterError && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-invalid={Boolean(newsletterError)}
                />

                {/* Custom Apple-styled Tooltip popup replacing browser native popup */}
                {newsletterError && (
                  <div
                    role="alert"
                    className="absolute left-4 -bottom-10 z-30 flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-1.5 text-xs font-medium shadow-xl border border-white/10 dark:border-black/10 animate-in fade-in-0 slide-in-from-top-1 duration-200"
                  >
                    {/* Top pointer arrow */}
                    <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-neutral-900 dark:bg-neutral-100" />
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600 shrink-0 relative z-10" />
                    <span className="relative z-10">{newsletterError}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-full font-medium shrink-0 shadow-xs"
              >
                <span>Subscribe</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground pt-1">
              No spam. Community updates only. Unsubscribe anytime.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
