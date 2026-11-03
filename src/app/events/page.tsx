"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";

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
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            Grassroots Action
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Upcoming Community Events
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Browse and join upcoming social service initiatives organized by your neighbours in Dhaka.
            All dates and times are in the future.
          </p>
        </div>

        <Button asChild className="gap-2 shrink-0 self-start md:self-auto font-semibold">
          <Link href="/events/create">
            <span>Organize an Event</span>
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search by title / location */}
          <div className="md:col-span-7 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by event title or location (e.g., Mirpur, Blanket, Dhanmondi)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-11 bg-background"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label="Clear search text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter by Event Type */}
          <div className="md:col-span-3">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-11 bg-background">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-4 w-4 text-primary shrink-0" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search submit button */}
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" className="h-11 w-full gap-2 font-semibold">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </div>
        </form>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/70 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Active filters:
            </span>
            {currentSearch && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5">
                Keyword: &ldquo;{currentSearch}&rdquo;
                <button
                  type="button"
                  onClick={() => applyFilters("", selectedType)}
                  className="rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentType !== "all" && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5">
                Type: {currentType}
                <button
                  type="button"
                  onClick={() => applyFilters(searchInput, "all")}
                  className="rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-primary hover:underline font-semibold ml-2"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <EventGridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEvents} />
      ) : events.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No Events Match Your Filters" : "No Upcoming Events Found"}
          description={
            hasActiveFilters
              ? "Try adjusting your search keywords or choosing another category."
              : "Check back soon, or organize a local drive yourself to support your community."
          }
          actionHref={hasActiveFilters ? undefined : "/events/create"}
          actionLabel={hasActiveFilters ? undefined : "Create New Event"}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-foreground">{events.length}</strong> upcoming {events.length === 1 ? "event" : "events"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
