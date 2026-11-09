"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, ArrowRight, Users, Star, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, getHighResImageUrl, formatCompactNumber } from "@/lib/utils";
import type { EventItem } from "@/lib/api";

interface EventCardProps {
  event: EventItem;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80";

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const [imgSrc, setImgSrc] = React.useState(
    getHighResImageUrl(event.thumbnail) || FALLBACK_IMAGE,
  );

  React.useEffect(() => {
    setImgSrc(getHighResImageUrl(event.thumbnail) || FALLBACK_IMAGE);
  }, [event.thumbnail]);

  const eventTarget = event.slug || event._id;

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate on card click unless the user clicked an explicit link or action button
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    router.push(`/events/${eventTarget}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="glass glass-card group flex flex-col h-full overflow-hidden p-3 rounded-[24px] cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/events/${eventTarget}`);
        }
      }}
      aria-label={`View details for ${event.title}`}
    >
      {/* Thumbnail with rounded corners inside the card and uniform edge-to-edge framing */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={event.title}
          decoding="async"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 [image-rendering:-webkit-optimize-contrast]"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
        {/* Apple-style dark scrim glass badge (always ultra-readable on any photo) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-white bg-black/55 backdrop-blur-md border border-white/20 shadow-xs">
            {event.eventType}
          </span>
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-[17px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.8rem] group-hover:text-foreground/90 transition-colors">
            {event.title}
          </h3>
          <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="space-y-2.5 border-t border-foreground/10 pt-3 text-[13px] text-muted-foreground">
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

          {/* Organizer Name & Star Rating (below volunteers joined) */}
          <div className="flex items-center justify-between pt-2 border-t border-foreground/5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {event.creatorName}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({Boolean(event.organization && event.organization.trim()) ? "Organization" : "Organizer"})
                </span>
              </span>
            </div>
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 shrink-0"
              title={`Organizer Trust Rating: ${Math.min(5.0, Math.max(0.0, event.organizerRating ?? 5.0)).toFixed(1)} / 5.0`}
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{Math.min(5.0, Math.max(0.0, event.organizerRating ?? 5.0)).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Pinned Action Button */}
        <div className="pt-2">
          <Button
            asChild
            className="w-full rounded-full gap-2 font-medium h-10 shadow-xs"
          >
            <Link href={`/events/${eventTarget}`}>
              <span>View Event</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
