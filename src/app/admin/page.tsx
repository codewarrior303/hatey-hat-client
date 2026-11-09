"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Users,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
  LogOut,
  Home,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Mail,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, authClient } from "@/lib/auth-client";
import { apiFetch, invalidateCache } from "@/lib/api";
import { formatDate, formatCompactNumber } from "@/lib/utils";

const AUTHORIZED_ADMIN_EMAIL = "abirahnafshahriar@gmail.com";

interface AdminStats {
  totalEventsCreated: number;
  totalEventsDeleted: number;
  upcomingEvents: number;
  concludedEvents: number;
  currentEventsCount: number;
  totalJoins: number;
  liveJoins: number;
  totalSubscribers?: number;
  totalUnsubscribed?: number;
}

interface EventItemAdmin {
  _id: string;
  title: string;
  eventType: string;
  creatorName: string;
  creatorEmail: string;
  location: string;
  eventDate: string;
  isConcluded: boolean;
  participants: number;
  createdAt: string;
}

interface SubscriberAdmin {
  _id: string;
  email: string;
  userName: string;
  status: "subscribed" | "unsubscribed";
  subscribedAt: string;
  unsubscribedAt?: string | null;
}

interface ActivityEntry {
  action: string;
  timestamp: string;
  userEmail?: string;
  ip: string;
  details?: Record<string, any>;
}

interface AdminData {
  stats: AdminStats;
  events: EventItemAdmin[];
  subscribers?: SubscriberAdmin[];
  recentActivity: ActivityEntry[];
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [isSigningInGoogle, setIsSigningInGoogle] = React.useState(false);
  const [adminData, setAdminData] = React.useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Filters for events list
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "concluded">("all");

  // Filters for recent security audit activity
  const [auditFilter, setAuditFilter] = React.useState<"all" | "joined" | "created" | "deleted">("all");

  // Filters for newsletter subscribers list
  const [subscribersFilter, setSubscribersFilter] = React.useState<"all" | "subscribed" | "unsubscribed">("all");

  const isAuthorized =
    user?.email?.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  // Track rejected unauthorized emails so we can inform the user even after session revocation
  const [rejectedEmail, setRejectedEmail] = React.useState<string | null>(null);

  // If a non-admin user lands on /admin (e.g. attempted login with unauthorized Google account),
  // immediately revoke and destroy the session so they are NEVER left logged in as a user on the site.
  React.useEffect(() => {
    if (user && !isAuthorized) {
      const email = user.email;
      setRejectedEmail(email);
      authClient.signOut().then(() => {
        invalidateCache();
        if (typeof window !== "undefined") {
          window.sessionStorage.clear();
        }
      });
    }
  }, [user, isAuthorized]);

  // Reset loading state on browser back/forward or tab return
  React.useEffect(() => {
    const handleReset = () => setIsSigningInGoogle(false);
    window.addEventListener("pageshow", handleReset);
    window.addEventListener("focus", handleReset);
    return () => {
      window.removeEventListener("pageshow", handleReset);
      window.removeEventListener("focus", handleReset);
    };
  }, []);

  const handleGoogleAdminLogin = async () => {
    try {
      setIsSigningInGoogle(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
    } catch (err: any) {
      setIsSigningInGoogle(false);
      toast.error(err?.message || "Could not authenticate with Google", {
        id: "admin-google-error",
      });
    }
  };

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isClearingConcluded, setIsClearingConcluded] = React.useState(false);

  const isFetchingRef = React.useRef(false);

  const fetchAdminMetrics = React.useCallback(
    async (isManualRefresh = false, isSilentPolling = false) => {
      if (isFetchingRef.current && isSilentPolling) return;
      isFetchingRef.current = true;
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (!isSilentPolling) {
        setIsLoading(true);
      }
      if (!isSilentPolling) {
        setError(null);
      }
      try {
        const res = await apiFetch<AdminData>("/api/admin/metrics", {
          auth: true,
          skipCache: true,
        });
        if (res?.data) {
          setAdminData(res.data);
        }
        if (isManualRefresh) {
          toast.success("Metrics refreshed with live database data!", {
            id: "admin-refresh-success",
          });
        }
      } catch (err: any) {
        if (!isSilentPolling) {
          setError(
            err?.message || "Failed to load administrative analytics from server."
          );
        }
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  React.useEffect(() => {
    if (isAuthorized) {
      fetchAdminMetrics();
    }
  }, [isAuthorized, fetchAdminMetrics]);

  // Adaptive background polling (10s interval, pauses when document is hidden)
  React.useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchAdminMetrics(false, true);
      }
    }, 10000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAdminMetrics(false, true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthorized, fetchAdminMetrics]);

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}" from the database? All volunteer join records for this event will also be removed.`)) {
      return;
    }

    setDeletingId(id);
    // Optimistic removal
    setAdminData((prev) =>
      prev
        ? {
            ...prev,
            events: prev.events.filter((e) => e._id !== id),
            stats: {
              ...prev.stats,
              currentEventsCount: Math.max(0, prev.stats.currentEventsCount - 1),
              totalEventsDeleted: prev.stats.totalEventsDeleted + 1,
            },
          }
        : null
    );

    try {
      const res = await apiFetch<any>(`/api/admin/events/${id}`, {
        method: "DELETE",
        auth: true,
      });
      invalidateCache("/api/events");
      invalidateCache("/api/joins");
      toast.success(res.message || "Event permanently removed from database");
      fetchAdminMetrics(false, true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete event from database");
      fetchAdminMetrics(false, true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearConcluded = async () => {
    if (!confirm("Are you sure you want to remove ALL concluded events from the database?")) {
      return;
    }

    setIsClearingConcluded(true);
    try {
      const res = await apiFetch<any>("/api/admin/events/concluded/all", {
        method: "DELETE",
        auth: true,
      });
      invalidateCache("/api/events");
      invalidateCache("/api/joins");
      toast.success(res.message || "Concluded events removed from database");
      fetchAdminMetrics(false, true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to clear concluded events");
    } finally {
      setIsClearingConcluded(false);
    }
  };

  // State 1: Checking authentication status
  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto rounded-xl" />
        <Skeleton className="h-4 w-80 mx-auto rounded-lg" />
      </div>
    );
  }

  // State 2: Not logged in – Show ONLY Google login portal
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-md">
        <div className="rounded-[32px] glass p-8 sm:p-10 text-center space-y-6 shadow-sm border border-foreground/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/10 text-foreground mx-auto">
            <ShieldCheck className="h-7 w-7 text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Portal
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Restricted system administration environment. Access is granted exclusively to authorized Google administrator accounts.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              size="lg"
              onClick={handleGoogleAdminLogin}
              disabled={isSigningInGoogle}
              className="w-full h-12 rounded-full font-medium gap-3 shadow-xs hover:scale-[1.01] transition-transform active:scale-95"
            >
              {isSigningInGoogle ? (
                <span>Connecting to Google...</span>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign in with Google as Admin</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Rejected unauthorized email (session automatically revoked)
  if (rejectedEmail || (user && !isAuthorized)) {
    const displayEmail = rejectedEmail || user?.email;
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <div className="rounded-[32px] glass p-8 sm:p-10 space-y-6 shadow-sm border border-destructive/20 animate-in fade-in-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Access Denied
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Google account you selected is not authorized:
            </p>
            <p className="text-sm font-semibold text-foreground bg-foreground/5 py-1.5 px-3 rounded-full inline-block">
              {displayEmail}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
              Session rejected and automatically terminated. You are not logged into the system.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              type="button"
              onClick={() => {
                setRejectedEmail(null);
                handleGoogleAdminLogin();
              }}
              className="rounded-full gap-2 shadow-xs"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Sign in with Authorized Admin Account</span>
            </Button>

            <Button
              asChild
              variant="outline"
              onClick={() => setRejectedEmail(null)}
              className="rounded-full gap-2 glass"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Return to Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Authorized Admin Dashboard
  const stats = adminData?.stats;
  const events = adminData?.events || [];
  const activity = adminData?.recentActivity || [];
  const subscribers = adminData?.subscribers || [];

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.creatorEmail.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "active") return !ev.isConcluded;
    if (statusFilter === "concluded") return ev.isConcluded;
    return true;
  });

  const filteredActivity = activity.filter((log) => {
    if (auditFilter === "joined") return log.action === "event_joined";
    if (auditFilter === "created") return log.action === "event_created";
    if (auditFilter === "deleted") return log.action === "event_deleted";
    return true;
  });

  const filteredSubscribers = subscribers.filter((sub) => {
    if (subscribersFilter === "subscribed") return sub.status !== "unsubscribed";
    if (subscribersFilter === "unsubscribed") return sub.status === "unsubscribed";
    return true;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-6xl space-y-8 animate-in fade-in-50">
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-foreground/10">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Platform Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Live overview of volunteer participation, events created, deletions, and concluded drives across Bangladesh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchAdminMetrics(true)}
            disabled={isRefreshing}
            className="rounded-full glass gap-2 h-10 px-4 transition-all"
          >
            <RefreshCw
              className={`h-4 w-4 transition-transform duration-700 ${
                isRefreshing ? "animate-spin text-foreground" : ""
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Metrics"}</span>
          </Button>

          <Button asChild variant="ghost" size="sm" className="rounded-full h-10">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-[26px]" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-[26px]" />
          <Skeleton className="h-64 rounded-[26px]" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-[24px] glass border border-destructive/20 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-medium text-foreground">{error}</p>
          <Button
            size="sm"
            onClick={() => fetchAdminMetrics()}
            className="rounded-full"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div
          className={`space-y-8 transition-opacity duration-300 ${
            isRefreshing ? "opacity-60 animate-pulse pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Top Core Metrics Grid - 5 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {/* 1. Total Events Created */}
            <div className="glass p-6 rounded-[26px] space-y-3 relative overflow-hidden shadow-2xs border border-foreground/10 hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Events Created
                </span>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactNumber(stats?.totalEventsCreated ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  All-time registered initiatives
                </p>
              </div>
            </div>

            {/* 2. Total Volunteers Joined */}
            <div className="glass p-6 rounded-[26px] space-y-3 relative overflow-hidden shadow-2xs border border-foreground/10 hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Volunteers Joined
                </span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactNumber(stats?.totalJoins ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  All-time joins ({formatCompactNumber(stats?.liveJoins ?? 0)} active)
                </p>
              </div>
            </div>

            {/* 3. Total Events Deleted */}
            <div className="glass p-6 rounded-[26px] space-y-3 relative overflow-hidden shadow-2xs border border-foreground/10 hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Events Deleted
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Trash2 className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactNumber(stats?.totalEventsDeleted ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Removed by organizers
                </p>
              </div>
            </div>

            {/* 4. Concluded Events */}
            <div className="glass p-6 rounded-[26px] space-y-3 relative overflow-hidden shadow-2xs border border-foreground/10 hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Concluded Events
                </span>
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactNumber(stats?.concludedEvents ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Past drives ({formatCompactNumber(stats?.upcomingEvents ?? 0)} active)
                </p>
              </div>
            </div>

            {/* 5. Total Newsletter Subscribers */}
            <div className="glass p-6 rounded-[26px] space-y-3 relative overflow-hidden shadow-2xs border border-foreground/10 hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subscribers
                </span>
                <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactNumber(stats?.totalSubscribers ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Active community subscribers
                </p>
              </div>
            </div>
          </div>

          {/* Initiatives Status & Breakdown Table */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Initiatives Breakdown ({formatCompactNumber(filteredEvents.length)})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Monitor event lifecycle, dates, and volunteer joins in real time.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search events, organizer, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-48 sm:w-60 rounded-full text-xs glass"
                  />
                </div>

                {/* Delete all concluded button if viewing concluded events */}
                {Boolean(stats?.concludedEvents && stats.concludedEvents > 0 && statusFilter === "concluded") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearConcluded}
                    disabled={isClearingConcluded}
                    className="h-8 rounded-full border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs gap-1.5 px-3 transition-colors"
                  >
                    {isClearingConcluded ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>{isClearingConcluded ? "Removing..." : "Delete Concluded"}</span>
                  </Button>
                )}

                <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs">
                  {(["all", "active", "concluded"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 select-none ${
                        statusFilter === tab
                          ? "bg-foreground text-background shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                No matching initiatives found.
              </div>
            ) : (
              <div className="rounded-[26px] glass overflow-hidden border border-foreground/10 transition-opacity duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-foreground/5 text-muted-foreground font-semibold border-b border-foreground/10">
                      <tr>
                        <th className="py-3 px-4">Event Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Organizer</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Volunteers Joined</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      {filteredEvents.map((ev) => (
                        <tr
                          key={ev._id}
                          className="hover:bg-foreground/5 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-foreground max-w-[220px] truncate">
                            {ev.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-foreground/10 text-foreground">
                              {ev.eventType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {ev.creatorName}
                              </span>
                              <span className="text-[10px] opacity-75">
                                {ev.creatorEmail}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {formatDate(ev.eventDate)}
                          </td>
                          <td className="py-3 px-4">
                            {ev.isConcluded ? (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-medium text-[10px] rounded-full gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                <span>Concluded</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium text-[10px] rounded-full gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Active</span>
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-foreground">
                            {formatCompactNumber(ev.participants)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                              >
                                <Link
                                  href={`/events/${ev._id}`}
                                  target="_blank"
                                  aria-label="Open public event"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEvent(ev._id, ev.title)}
                                disabled={deletingId === ev._id}
                                title="Permanently delete from database"
                                className="h-7 w-7 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              >
                                {deletingId === ev._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Newsletter Community Subscribers Section */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Newsletter Subscribers ({formatCompactNumber(filteredSubscribers.length)})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Citizens registered to receive emergency relief alerts and community updates.
                </p>
              </div>

              {/* Tabs for Subscribers: All, Active, Unsubscribed */}
              <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs">
                {(["all", "subscribed", "unsubscribed"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubscribersFilter(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 select-none ${
                      subscribersFilter === tab
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "subscribed" ? "Active" : tab === "unsubscribed" ? "Unsubscribed" : "All"}
                  </button>
                ))}
              </div>
            </div>

            {filteredSubscribers.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                No matching newsletter subscribers found.
              </div>
            ) : (
              <div className="rounded-[26px] glass overflow-hidden border border-foreground/10 transition-opacity duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-foreground/5 text-muted-foreground font-semibold border-b border-foreground/10">
                      <tr>
                        <th className="py-3 px-4">Subscriber Email</th>
                        <th className="py-3 px-4">Name / ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Subscribed Date</th>
                        <th className="py-3 px-4">Unsubscribed Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      {filteredSubscribers.map((sub) => {
                        const isUnsub = sub.status === "unsubscribed";
                        return (
                          <tr
                            key={sub._id || sub.email}
                            className="hover:bg-foreground/5 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{sub.email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {sub.userName || sub.email.split("@")[0]}
                            </td>
                            <td className="py-3 px-4">
                              {isUnsub ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Unsubscribed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Subscribed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {sub.subscribedAt ? formatDate(sub.subscribedAt) : "—"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {sub.unsubscribedAt ? formatDate(sub.unsubscribedAt) : isUnsub ? "Yes" : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Audit & Security Activity Stream */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Recent System & Security Audit Logs ({formatCompactNumber(filteredActivity.length)})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Real-time security trail of user join actions, event creations, and administrative updates.
                </p>
              </div>

              {/* Tabs: All, Joined, Created, Deleted */}
              <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs">
                {(["all", "joined", "created", "deleted"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAuditFilter(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 select-none ${
                      auditFilter === tab
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] glass p-4 sm:p-6 border border-foreground/10 space-y-2.5">
              {filteredActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {auditFilter === "all"
                    ? "No recent system or security audit logs."
                    : `No audit logs matching "${auditFilter}" filter.`}
                </p>
              ) : (
                <div className="divide-y divide-foreground/5 max-h-80 overflow-y-auto no-scrollbar">
                  {filteredActivity.map((log, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-foreground/[0.02] px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            log.action === "event_deleted"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : log.action === "event_created"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : log.action === "event_joined"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-foreground/10 text-foreground"
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-foreground font-medium truncate max-w-xs">
                          {log.userEmail || "System"}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {log.timestamp ? formatDate(log.timestamp) : "Recently"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
