"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, SlidersHorizontal, PlusCircle, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

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
import { apiFetch, getCachedData, EVENT_TYPES, type EventItem } from "@/lib/api";

const EVENTS_PER_PAGE = 9;

export default function UpcomingEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "all";

  const [searchInput, setSearchInput] = React.useState(currentSearch);
  const [selectedType, setSelectedType] = React.useState(currentType);

  // Endpoint helper for cache-key and fetch synchronization
  const getEndpoint = (search: string, type: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type && type !== "all") params.set("type", type);
    const qs = params.toString();
    return `/api/events${qs ? `?${qs}` : ""}`;
  };

  const initialEndpoint = getEndpoint(currentSearch, currentType);
  const cachedInitialEvents = typeof window !== "undefined" ? getCachedData<EventItem[]>(initialEndpoint) : null;
  const cachedAllEvents = typeof window !== "undefined" ? getCachedData<EventItem[]>("/api/events") : null;

  const [events, setEvents] = React.useState<EventItem[]>(cachedInitialEvents || []);
  const [allEvents, setAllEvents] = React.useState<EventItem[]>(cachedAllEvents || []);
  const [isLoading, setIsLoading] = React.useState(!cachedInitialEvents);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const eventsSectionRef = React.useRef<HTMLElement>(null);

  // Reset to first page whenever search or category filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [currentSearch, currentType]);

  // Suggestions state
  const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync state if URL changes externally (e.g. back/forward navigation)
  React.useEffect(() => {
    setSearchInput(currentSearch);
    setSelectedType(currentType);
  }, [currentSearch, currentType]);

  // Load full events catalog once for real-time autocomplete indexing
  React.useEffect(() => {
    apiFetch<EventItem[]>("/api/events")
      .then((res) => {
        if (res.data) setAllEvents(res.data);
      })
      .catch(() => {});
  }, []);

  // Filter suggestions in real-time as user types or backspaces
  const trimmedQuery = searchInput.trim().toLowerCase();

  const matchingSuggestions = React.useMemo(() => {
    if (!trimmedQuery) return [];

    return allEvents
      .filter((evt) => {
        const titleMatch = evt.title?.toLowerCase().includes(trimmedQuery);
        const locMatch = evt.location?.toLowerCase().includes(trimmedQuery);
        const typeMatch = evt.eventType?.toLowerCase().includes(trimmedQuery);
        return titleMatch || locMatch || typeMatch;
      })
      .slice(0, 6);
  }, [allEvents, trimmedQuery]);

  // Click outside listener for suggestions dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const selectSuggestion = (event: EventItem) => {
    setSearchInput(event.title);
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    applyFilters(event.title, selectedType);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || matchingSuggestions.length === 0) {
      if (e.key === "ArrowDown" && trimmedQuery && matchingSuggestions.length > 0) {
        setIsSuggestionsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % matchingSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + matchingSuggestions.length) % matchingSuggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < matchingSuggestions.length) {
        e.preventDefault();
        selectSuggestion(matchingSuggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Fetch events from server whenever query parameters change
  const fetchEvents = React.useCallback(async () => {
    try {
      const endpoint = getEndpoint(currentSearch, currentType);
      const cached = typeof window !== "undefined" ? getCachedData<EventItem[]>(endpoint) : null;
      if (!cached) {
        setIsLoading(true);
      }
      setError(null);

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

  // Pagination calculations (9 initiatives per page)
  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedEvents = React.useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * EVENTS_PER_PAGE;
    return events.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [events, safeCurrentPage]);

  const getVisiblePages = (current: number, total: number) => {
    const maxVisible = 5;
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, current - 2);
    let end = start + maxVisible - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  };

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
          {/* Search by title / location with Real-Time Suggestions */}
          <div ref={searchContainerRef} className="md:col-span-7 relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              maxLength={50}
              placeholder="Search by title or landmark (Mirpur, Blanket, Dhanmondi)..."
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value.slice(0, 50);
                setSearchInput(val);
                setHighlightedIndex(-1);
                setIsSuggestionsOpen(val.trim().length > 0);
              }}
              onFocus={() => {
                if (trimmedQuery.length > 0) setIsSuggestionsOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="pl-11 pr-10 h-11 rounded-full glass bg-transparent border-foreground/15 text-sm"
              autoComplete="off"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setIsSuggestionsOpen(false);
                  applyFilters("", selectedType);
                }}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search text"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Live Autocomplete Suggestions Card (Frosted Apple Liquid Glass) */}
            {isSuggestionsOpen && (
              <div
                role="listbox"
                aria-label="Search suggestions"
                className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl glass-menu p-2 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 overflow-hidden"
              >
                {matchingSuggestions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-foreground/10">
                      <span>Initiative Suggestions</span>
                      <span>{matchingSuggestions.length} found</span>
                    </div>
                    {matchingSuggestions.map((item, index) => {
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <button
                          key={item._id}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          onClick={() => selectSuggestion(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all select-none",
                            isHighlighted
                              ? "bg-foreground/10 text-foreground"
                              : "hover:bg-foreground/5 text-foreground/90"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 border border-foreground/10">
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                <span className="truncate">{item.location}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="secondary"
                              className="rounded-full text-[10px] px-2 py-0.5 font-normal glass"
                            >
                              {item.eventType}
                            </Badge>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center text-sm text-muted-foreground overflow-hidden">
                    <p className="font-medium text-foreground">No matching initiatives</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 max-w-full px-2 break-all line-clamp-1">
                      Press Search or Enter to query all records for &ldquo;{searchInput.slice(0, 30)}{searchInput.length > 30 ? "..." : ""}&rdquo;
                    </p>
                  </div>
                )}
              </div>
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
              <SelectContent className="glass-menu rounded-2xl p-1.5 shadow-2xl">
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
      <section ref={eventsSectionRef} className="scroll-mt-24">
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {/* Pagination Controls - Displayed only when total events exceed 9 */}
            {totalPages > 1 && (
              <nav
                role="navigation"
                aria-label="Events pagination"
                className="flex items-center justify-center gap-2 pt-10 pb-4 animate-in fade-in-50"
              >
                {/* Previous Page Button (<) */}
                {safeCurrentPage > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl glass border border-foreground/15 text-foreground hover:bg-foreground/10 transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                {/* Numbered Page Buttons */}
                {getVisiblePages(safeCurrentPage, totalPages).map((pageNum) => {
                  const isActive = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 select-none",
                        isActive
                          ? "bg-foreground text-background shadow-md scale-105"
                          : "glass border border-foreground/15 text-foreground/85 hover:text-foreground hover:bg-foreground/10"
                      )}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Page Button (>) */}
                {safeCurrentPage < totalPages && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl glass border border-foreground/15 text-foreground hover:bg-foreground/10 transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
