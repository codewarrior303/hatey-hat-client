"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, ArrowRight, Users } from "lucide-react";

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate on card click unless the user clicked an explicit link or action button
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    router.push(`/events/${event._id}`);
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
          router.push(`/events/${event._id}`);
        }
      }}
      aria-label={`View details for ${event.title}`}
    >
      {/* Thumbnail with rounded corners inside the card and fixed 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={event.title}
          width={480}
          height={300}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
        {/* Apple-style dark scrim glass badge (always ultra-readable on any photo) */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
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

          {typeof event.participants === "number" && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Users className="h-4 w-4 text-foreground/60 shrink-0" />
              <span>
                {formatCompactNumber(event.participants)}{" "}
                {event.participants === 1 ? "volunteer" : "volunteers"} joined
              </span>
            </div>
          )}
        </div>

        {/* Pinned Action Button */}
        <div className="pt-2">
          <Button
            asChild
            className="w-full rounded-full gap-2 font-medium h-10 shadow-xs"
          >
            <Link href={`/events/${event._id}`}>
              <span>View Event</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
