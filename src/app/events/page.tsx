"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, SlidersHorizontal, PlusCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCard } from "@/components/events/event-card";
import { EventGridSkeleton } from "@/components/events/event-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { apiFetch, EVENT_TYPES, type EventItem } from "@/lib/api";

export default function UpcomingEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "all";

  const [searchInput, setSearchInput] = React.useState(currentSearch);
  const [selectedType, setSelectedType] = React.useState(currentType);

  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state if URL changes externally (e.g. back/forward navigation)
  React.useEffect(() => {
    setSearchInput(currentSearch);
    setSelectedType(currentType);
  }, [currentSearch, currentType]);

  // Fetch events from server whenever query parameters change
  const fetchEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentType && currentType !== "all") params.set("type", currentType);

      const qs = params.toString();
      const endpoint = `/api/events${qs ? `?${qs}` : ""}`;

      const res = await apiFetch<EventItem[]>(endpoint);
      setEvents(res.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load upcoming events");
    } finally {
      setIsLoading(false);
    }
  }, [currentSearch, currentType]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Apply filters to URL
  const applyFilters = (searchVal: string, typeVal: string) => {
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (typeVal && typeVal !== "all") params.set("type", typeVal);

    const qs = params.toString();
    router.push(`/events${qs ? `?${qs}` : ""}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchInput, selectedType);
  };

  const handleTypeChange = (typeVal: string) => {
    setSelectedType(typeVal);
    applyFilters(searchInput, typeVal);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSelectedType("all");
    router.push("/events");
  };

  const hasActiveFilters = Boolean(currentSearch || (currentType && currentType !== "all"));

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-foreground/10">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Grassroots Action
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Upcoming Initiatives
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-2xl">
            Browse and join upcoming social welfare drives across Dhaka neighbourhoods.
          </p>
        </div>

        <Button asChild className="gap-2 shrink-0 self-start md:self-auto rounded-full font-medium h-11 px-6 shadow-xs">
          <Link href="/events/create">
            <PlusCircle className="h-4 w-4" />
            <span>Organize an Event</span>
          </Link>
        </Button>
      </div>

      {/* Floating Glass Filter and Search Bar */}
      <div className="rounded-[28px] glass p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search by title / location */}
          <div className="md:col-span-7 relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by title or landmark (Mirpur, Blanket, Dhanmondi)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 pr-10 h-11 rounded-full glass bg-transparent border-foreground/15 text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter by Event Type */}
          <div className="md:col-span-3">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-11 rounded-full glass bg-transparent border-foreground/15 text-sm px-4">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-4 w-4 text-foreground/60 shrink-0" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent className="glass border-border/60 rounded-2xl p-1.5 shadow-xl">
                <SelectItem value="all" className="rounded-xl cursor-pointer">
                  All Categories
                </SelectItem>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="rounded-xl cursor-pointer">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search submit button */}
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" className="h-11 w-full gap-2 rounded-full font-medium shadow-xs">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </div>
        </form>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-foreground/10 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters:
            </span>
            {currentSearch && (
              <Badge variant="secondary" className="glass gap-1.5 rounded-full px-3 py-1 font-normal text-foreground">
                &ldquo;{currentSearch}&rdquo;
                <button
                  type="button"
                  onClick={() => applyFilters("", selectedType)}
                  className="rounded-full hover:opacity-75 p-0.5 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentType !== "all" && (
              <Badge variant="secondary" className="glass gap-1.5 rounded-full px-3 py-1 font-normal text-foreground">
                {currentType}
                <button
                  type="button"
                  onClick={() => applyFilters(searchInput, "all")}
                  className="rounded-full hover:opacity-75 p-0.5 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-7 px-3 rounded-full text-muted-foreground hover:text-foreground"
            >
              Reset all
            </Button>
          </div>
        )}
      </div>

      {/* Events Grid / State Views */}
      <section>
        {isLoading ? (
          <EventGridSkeleton count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No Matching Initiatives Found"
            description={
              hasActiveFilters
                ? "Try clearing your keywords or choosing a different category."
                : "No upcoming events scheduled right now. Check back soon or start one!"
            }
            actionHref={hasActiveFilters ? undefined : "/events/create"}
            actionLabel={hasActiveFilters ? undefined : "Organize an Event"}
            onReset={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
