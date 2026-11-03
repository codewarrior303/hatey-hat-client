"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowRight, Users } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { EventItem, EventType } from "@/lib/api";

interface EventCardProps {
  event: EventItem;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80";

const TYPE_COLORS: Record<EventType, string> = {
  Donation: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  Cleanup: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  Plantation: "bg-green-500/15 text-green-800 dark:text-green-300 border-green-500/30",
  "Food Distribution": "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30",
  "Blood Donation": "bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30",
  Education: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
  "Health Camp": "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
  Other: "bg-muted text-muted-foreground border-border",
};

export function EventCard({ event }: EventCardProps) {
  const [imgSrc, setImgSrc] = React.useState(event.thumbnail || FALLBACK_IMAGE);

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Thumbnail with fixed 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`font-semibold backdrop-blur-md shadow-xs ${
              TYPE_COLORS[event.eventType] || TYPE_COLORS.Other
            }`}
          >
            {event.eventType}
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="font-heading text-lg font-bold text-foreground leading-snug line-clamp-2 min-h-[3rem]">
            {event.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground/90 truncate">
              {formatDate(event.eventDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          {typeof event.participants === "number" && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>{event.participants} {event.participants === 1 ? "volunteer joined" : "volunteers joined"}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button asChild className="w-full gap-2 font-semibold">
          <Link href={`/events/${event._id}`}>
            <span>View Event</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
