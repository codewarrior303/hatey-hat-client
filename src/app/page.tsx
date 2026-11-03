"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  PlusCircle,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Send,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/events/event-card";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, type EventItem } from "@/lib/api";

export default function HomePage() {
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRecentEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<EventItem[]>("/api/events?limit=6");
      setEvents(res.data || []);
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
    toast.success("Thank you for subscribing to community updates!");
  };

  // Curated static gallery of community service photographs with equal sizes
  const galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&h=400&q=80",
      alt: "Distributing food and clothes to vulnerable children in Dhaka",
      caption: "Winter Relief Camp – Mirpur",
    },
    {
      src: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=600&h=400&q=80",
      alt: "Volunteers gathering donations and relief boxes",
      caption: "Blanket Drive – Mohammadpur",
    },
    {
      src: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&h=400&q=80",
      alt: "Youth volunteers cleaning up the riverbank",
      caption: "Turag Cleanup – Uttara",
    },
    {
      src: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&h=400&q=80",
      alt: "Hands holding and nurturing a young sapling",
      caption: "Tree Plantation – Dhanmondi",
    },
    {
      src: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=600&h=400&q=80",
      alt: "Packing meal containers for distribution",
      caption: "Hot Meal Program – Old Dhaka",
    },
    {
      src: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=600&h=400&q=80",
      alt: "Volunteer donating blood for emergency patients",
      caption: "Blood Donation Camp – Farmgate",
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: "Hyper-Local Dhaka Drives",
      description:
        "Find relief camps, winter clothing drives, and medical aid right in your neighbourhood — from Mirpur and Mohammadpur to Uttara and Dhanmondi.",
    },
    {
      icon: HeartHandshake,
      title: "One-Click Volunteer Joining",
      description:
        "Join any community initiative with a single click. Keep track of all your upcoming volunteer commitments in your personal dashboard.",
    },
    {
      icon: PlusCircle,
      title: "Community Event Creation",
      description:
        "Have a cause in mind? Launch a clothes drive, park cleanup, or educational circle in under two minutes with transparent details.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Organizers & Accountability",
      description:
        "Every event is backed by authenticated organizers. Manage attendance, communicate schedules, and protect community trust.",
    },
  ];

  return (
    <div className="flex flex-col space-y-16 md:space-y-24 pb-16">
      {/* 1. HERO / BANNER SECTION */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        {/* Subtle decorative background circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative mx-auto px-4 sm:px-6 text-center max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary backdrop-blur-xs">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Hate hat, ekshathe poth chola</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Unite with Neighbours to Build a{" "}
            <span className="text-primary underline decoration-accent decoration-wavy decoration-2 underline-offset-8">
              Kinder, Stronger
            </span>{" "}
            Dhaka
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A community-driven event platform where everyday citizens organize, join,
            and track grassroots social service drives — from warm winter clothes distribution
            to neighbourhood cleanups and healthcare camps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-bold px-8 shadow-md">
              <Link href="/events">
                <CalendarDays className="h-5 w-5" />
                <span>Explore Upcoming Events</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 font-semibold border-border hover:bg-muted"
            >
              <Link href="/events/create">
                <PlusCircle className="h-5 w-5 text-primary" />
                <span>Organize an Event</span>
              </Link>
            </Button>
          </div>

          {/* Impact Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-border/80 max-w-3xl mx-auto">
            <div className="space-y-1">
              <p className="font-heading text-2xl md:text-3xl font-bold text-primary">100%</p>
              <p className="text-xs text-muted-foreground font-medium">Grassroots & Free</p>
            </div>
            <div className="space-y-1">
              <p className="font-heading text-2xl md:text-3xl font-bold text-accent">500+</p>
              <p className="text-xs text-muted-foreground font-medium">Active Volunteers</p>
            </div>
            <div className="space-y-1">
              <p className="font-heading text-2xl md:text-3xl font-bold text-primary">15+</p>
              <p className="text-xs text-muted-foreground font-medium">Dhaka Neighbourhoods</p>
            </div>
            <div className="space-y-1">
              <p className="font-heading text-2xl md:text-3xl font-bold text-accent">2,400+</p>
              <p className="text-xs text-muted-foreground font-medium">Lives Touched</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            Platform Capabilities
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Built for Community Action
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Everything you need to turn compassionate intentions into coordinated neighbourhood support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col justify-between border-border bg-card p-6 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. RECENT UPCOMING EVENTS (DYNAMIC) */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <Badge variant="outline" className="border-accent/40 text-accent font-semibold">
              Get Involved
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Recent Upcoming Events
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              The soonest upcoming social service initiatives happening across Dhaka.
            </p>
          </div>

          <Button asChild variant="outline" className="gap-2 shrink-0 border-border self-start sm:self-auto">
            <Link href="/events">
              <span>View All Events</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

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
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* 4. GALLERY SECTION (STATIC, EQUAL SIZES) */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            On The Ground
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Moments of Impact
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            A glimpse into the warmth, hard work, and solidarity of Dhaka volunteers in action.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-heading text-base font-semibold text-white drop-shadow-xs">
                  {img.caption}
                </p>
                <p className="text-xs text-white/80 line-clamp-1">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NEWSLETTER SECTION */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 sm:p-12 lg:p-16 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mx-auto shadow-sm">
              <Send className="h-6 w-6 text-accent" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Stay In The Community Loop
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Receive weekly summaries of urgent relief calls, seasonal drives, and volunteer
                opportunities happening across Dhaka neighbourhoods.
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email address"
                required
                className="h-11 bg-background"
              />
              <Button type="submit" size="lg" className="w-full sm:w-auto font-semibold gap-2 h-11 shrink-0">
                <span>Subscribe</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              No spam, ever. Unsubscribe anytime with a single click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
