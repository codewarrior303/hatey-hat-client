"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Users,
  Trash2,
  Clock,
  RefreshCw,
  Home,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Mail,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  UserCheck,
  UserX,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import { GoogleIcon } from "@/components/icons/google-icon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession, authClient } from "@/lib/auth-client";
import { apiFetch, invalidateCache } from "@/lib/api";
import { formatDate, formatCompactNumber, cn, getHighResImageUrl, getFallbackAvatar } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  totalUsers?: number;
  activeUsers?: number;
  inactiveUsers?: number;
  googleUsers?: number;
  emailUsers?: number;
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

interface OrganizerStrikeAdmin {
  _id: string;
  userEmail: string;
  userName?: string;
  stage: "normal" | "suspended" | "probation" | "permanently_banned";
  earlyCancellations: number;
  probationStrikes: number;
  appealRequest?: {
    message: string;
    requestedAt: string;
    status: "pending" | "approved" | "rejected";
    reviewedAt?: string;
    reviewNote?: string;
  } | null;
  cancellationHistory?: Array<{
    eventId: string;
    eventTitle: string;
    eventDate: string;
    cancelledAt: string;
    reason: string;
  }>;
  unlockedAt?: string;
  unlockedBy?: string;
  bannedAt?: string;
  hasTwoMonthBanHistory?: boolean;
  probationBaseRating?: number;
  updatedAt: string;
}

interface UserAccountAdmin {
  _id: string;
  name: string;
  email: string;
  image?: string | null;
  provider: "google" | "email";
  status: "active" | "inactive" | "suspended";
  isBanned: boolean;
  bannedAt?: string | null;
  createdAt: string;
}

interface AdminData {
  stats: AdminStats;
  events: EventItemAdmin[];
  subscribers?: SubscriberAdmin[];
  users?: UserAccountAdmin[];
  recentActivity: ActivityEntry[];
}

export default function AdminPage() {
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
  const [auditFilter, setAuditFilter] = React.useState<"all" | "joined" | "created" | "deleted" | "subscribers">("all");

  // Filters for newsletter subscribers list
  const [subscriberSearchQuery, setSubscriberSearchQuery] = React.useState("");
  const [subscribersFilter, setSubscribersFilter] = React.useState<"all" | "subscribed" | "unsubscribed">("all");

  // Filters for registered users list
  const [userSearchQuery, setUserSearchQuery] = React.useState("");
  const [userProviderFilter, setUserProviderFilter] = React.useState<"all" | "google" | "email">("all");
  const [banningUserId, setBanningUserId] = React.useState<string | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<UserAccountAdmin | null>(null);
  const [isDeletingUser, setIsDeletingUser] = React.useState(false);

  const isAuthorized =
    user?.email?.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

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
  const [eventToDelete, setEventToDelete] = React.useState<{ id: string; title: string } | null>(null);
  const [isClearingConcluded, setIsClearingConcluded] = React.useState(false);
  const [isConfirmingClearConcluded, setIsConfirmingClearConcluded] = React.useState(false);

  // Organizer appeals & strikes
  const [appeals, setAppeals] = React.useState<OrganizerStrikeAdmin[]>([]);
  const [processingAppealAction, setProcessingAppealAction] = React.useState<{
    email: string;
    action: "approve" | "reject" | "unban";
  } | null>(null);
  const [expandedEmailHistory, setExpandedEmailHistory] = React.useState<Record<string, boolean>>({});
  // Section 1: Organizer Appeals & Strikes (7-Day Probation & Suspensions)
  const [appealTab, setAppealTab] = React.useState<"all" | "appeals" | "approved" | "rejected">("all");
  const [appealSearchQuery, setAppealSearchQuery] = React.useState("");

  // Section 2: 2-Month Ban & Reinstatement Management
  const [banTab, setBanTab] = React.useState<"all" | "banned" | "appeals" | "restored">("all");
  const [banSearchQuery, setBanSearchQuery] = React.useState("");

  // Helper to determine if an organizer belongs to Section 2 (2-month ban: active or past unbanned)
  const isTwoMonthRecord = React.useCallback((a: OrganizerStrikeAdmin) => {
    const note = (a.appealRequest?.reviewNote || "").toLowerCase();
    return Boolean(
      a.stage === "permanently_banned" ||
      (a as any).hasTwoMonthBanHistory ||
      Boolean(a.bannedAt) ||
      a.unlockedBy === "automation_2_months" ||
      a.unlockedBy === "platform_admin" ||
      (a.probationBaseRating !== undefined && a.probationBaseRating <= 2.5) ||
      note.includes("2.5") ||
      note.includes("2-month") ||
      note.includes("unbanned by platform administration") ||
      (a.earlyCancellations !== undefined && a.earlyCancellations >= 4) ||
      (a.probationStrikes !== undefined && a.probationStrikes >= 2)
    );
  }, []);

  // Split into Section 1 (7-day cooling-off / suspensions / 1st-tier strikes) and Section 2 (2-month bans)
  const strikeAppeals = React.useMemo(() => {
    return appeals.filter((a) => !isTwoMonthRecord(a));
  }, [appeals, isTwoMonthRecord]);

  const twoMonthBans = React.useMemo(() => {
    return appeals.filter((a) => isTwoMonthRecord(a));
  }, [appeals, isTwoMonthRecord]);

  const pendingStrikeAppealsCount = React.useMemo(
    () => strikeAppeals.filter((a) => a.appealRequest?.status === "pending").length,
    [strikeAppeals]
  );

  const pendingBanAppealsCount = React.useMemo(
    () =>
      twoMonthBans.filter(
        (a) =>
          a.stage === "permanently_banned" &&
          a.appealRequest?.status === "pending" &&
          (!a.bannedAt || new Date(a.appealRequest.requestedAt).getTime() >= new Date(a.bannedAt).getTime())
      ).length,
    [twoMonthBans]
  );

  const filteredStrikeAppeals = React.useMemo(() => {
    let list = strikeAppeals;
    if (appealTab === "appeals") {
      list = list.filter((a) => a.appealRequest?.status === "pending");
    } else if (appealTab === "approved") {
      list = list.filter((a) => a.appealRequest?.status === "approved" || a.stage === "probation");
    } else if (appealTab === "rejected") {
      list = list.filter((a) => a.appealRequest?.status === "rejected");
    }

    if (appealSearchQuery.trim()) {
      const q = appealSearchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.userEmail.toLowerCase().includes(q) ||
          (a.userName && a.userName.toLowerCase().includes(q)) ||
          (a.appealRequest?.message && a.appealRequest.message.toLowerCase().includes(q)) ||
          (a.cancellationHistory &&
            a.cancellationHistory.some(
              (c) =>
                c.eventTitle.toLowerCase().includes(q) ||
                c.reason.toLowerCase().includes(q)
            ))
      );
    }
    return list;
  }, [strikeAppeals, appealTab, appealSearchQuery]);

  const filteredTwoMonthBans = React.useMemo(() => {
    let list = twoMonthBans;
    if (banTab === "banned") {
      list = list.filter((a) => a.stage === "permanently_banned");
    } else if (banTab === "appeals") {
      list = list.filter(
        (a) =>
          a.stage === "permanently_banned" &&
          a.appealRequest?.status === "pending" &&
          (!a.bannedAt || new Date(a.appealRequest.requestedAt).getTime() >= new Date(a.bannedAt).getTime())
      );
    } else if (banTab === "restored") {
      list = list.filter((a) => a.stage !== "permanently_banned");
    }

    if (banSearchQuery.trim()) {
      const q = banSearchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.userEmail.toLowerCase().includes(q) ||
          (a.userName && a.userName.toLowerCase().includes(q)) ||
          (a.appealRequest?.message && a.appealRequest.message.toLowerCase().includes(q)) ||
          (a.cancellationHistory &&
            a.cancellationHistory.some(
              (c) =>
                c.eventTitle.toLowerCase().includes(q) ||
                c.reason.toLowerCase().includes(q)
            ))
      );
    }
    return list;
  }, [twoMonthBans, banTab, banSearchQuery]);

  const toggleHistory = (email: string) => {
    setExpandedEmailHistory((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const handleApproveAppeal = async (email: string) => {
    try {
      setProcessingAppealAction({ email, action: "approve" });
      const res = await apiFetch<any>(
        `/api/admin/appeals/${encodeURIComponent(email)}/approve`,
        {
          method: "POST",
          auth: true,
        }
      );
      toast.success(res.message || "Organizer reinstated on probation!");
      fetchAdminMetrics(false, true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve appeal");
    } finally {
      setProcessingAppealAction(null);
    }
  };

  const handleRejectAppeal = async (email: string) => {
    try {
      setProcessingAppealAction({ email, action: "reject" });
      const res = await apiFetch<any>(
        `/api/admin/appeals/${encodeURIComponent(email)}/reject`,
        {
          method: "POST",
          auth: true,
        }
      );
      toast.success(res.message || "Appeal marked as rejected");
      fetchAdminMetrics(false, true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject appeal");
    } finally {
      setProcessingAppealAction(null);
    }
  };

  const handleUnbanOrganizer = async (email: string) => {
    try {
      setProcessingAppealAction({ email, action: "unban" });
      const res = await apiFetch<any>(
        `/api/admin/appeals/${encodeURIComponent(email)}/unban`,
        {
          method: "POST",
          auth: true,
        }
      );
      toast.success(res.message || "Organizer unbanned and restored on probation!");
      fetchAdminMetrics(false, true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to unban organizer");
    } finally {
      setProcessingAppealAction(null);
    }
  };

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
        const [res, appealsRes] = await Promise.all([
          apiFetch<AdminData>("/api/admin/metrics", {
            auth: true,
            skipCache: true,
          }),
          apiFetch<OrganizerStrikeAdmin[]>("/api/admin/appeals", {
            auth: true,
            skipCache: true,
          }).catch(() => ({ data: [] as OrganizerStrikeAdmin[] })),
        ]);
        if (res?.data) {
          setAdminData(res.data);
        }
        if (appealsRes?.data) {
          setAppeals(appealsRes.data);
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

  // Adaptive background polling (15s interval, pauses when document is hidden)
  React.useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchAdminMetrics(false, true);
      }
    }, 15000);

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

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const { id } = eventToDelete;

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
      setEventToDelete(null);
    }
  };

  const confirmClearConcluded = async () => {
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
      setIsConfirmingClearConcluded(false);
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

  // State 3: User logged in, but not the authorized administrator
  if (user && !isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <div className="rounded-[32px] glass p-8 sm:p-10 space-y-6 shadow-sm border border-amber-500/20 animate-in fade-in-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Access Restricted
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are signed in as:
            </p>
            <p className="text-sm font-semibold text-foreground bg-foreground/5 py-1.5 px-3 rounded-full inline-block truncate max-w-full">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
              This account does not have platform administrative privileges. Your regular user session is safe and active. To access this panel, sign in with the authorized Google administrator account.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={isSigningInGoogle}
              className="rounded-full gap-2 shadow-xs"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSigningInGoogle ? "Connecting to Google..." : "Sign in with Admin Google Account"}</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="rounded-full gap-2 glass"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Return to Main Site</span>
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
    if (auditFilter === "subscribers") {
      return (
        log.action === "subscriber_added" ||
        log.action === "subscriber_unsubscribed"
      );
    }
    return true;
  });

  const filteredSubscribers = subscribers.filter((sub) => {
    const q = subscriberSearchQuery.toLowerCase().trim();
    if (q) {
      const matches =
        sub.email.toLowerCase().includes(q) ||
        (sub.userName && sub.userName.toLowerCase().includes(q)) ||
        (sub._id && sub._id.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (subscribersFilter === "subscribed") return sub.status !== "unsubscribed";
    if (subscribersFilter === "unsubscribed") return sub.status === "unsubscribed";
    return true;
  });

  const users = adminData?.users || [];
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (userProviderFilter === "google") return u.provider === "google";
    if (userProviderFilter === "email") return u.provider === "email";
    return true;
  });

  const handleToggleBanUser = async (targetUser: UserAccountAdmin) => {
    try {
      setBanningUserId(targetUser._id);
      const res = await apiFetch<{
        success: boolean;
        message: string;
        isBanned: boolean;
      }>(
        `/api/admin/users/${encodeURIComponent(targetUser._id)}/toggle-ban`,
        {
          method: "POST",
          auth: true,
        }
      );

      toast.success(res.message || "User status updated successfully.");

      const isNowBanned = (res as any)?.isBanned ?? res.data?.isBanned ?? !targetUser.isBanned;

      setAdminData((prev) => {
        if (!prev) return prev;
        const updatedUsers = (prev.users || []).map((u) =>
          u._id === targetUser._id ? { ...u, isBanned: isNowBanned } : u
        );
        return { ...prev, users: updatedUsers };
      });

      invalidateCache("/api/admin/metrics");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user status.");
    } finally {
      setBanningUserId(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      const res = await apiFetch<{ success: boolean; message: string }>(
        `/api/admin/users/${encodeURIComponent(userToDelete._id)}`,
        {
          method: "DELETE",
          auth: true,
        }
      );
      toast.success(res.message || "User account removed from database.");
      setAdminData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: (prev.users || []).filter((u) => u._id !== userToDelete._id),
          stats: {
            ...prev.stats,
            totalUsers: Math.max(0, (prev.stats.totalUsers || 1) - 1),
          },
        };
      });
      invalidateCache("/api/admin/metrics");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete user account.");
    } finally {
      setIsDeletingUser(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-12 max-w-6xl space-y-8 animate-in fade-in-50">
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-foreground/10">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Platform Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Live overview of volunteer participation, events created, deletions, and concluded events across Bangladesh.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          {/* Top Core Metrics Grid - 6 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
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
                  All-time joins
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
                  Past events
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
                  Total community subscribers
                </p>
              </div>
            </div>

            {/* 6. Registered Platform Users */}
            <div className="glass p-6 rounded-[26px] space-y-3 relative overflow-hidden shadow-2xs border border-foreground/10 hover:border-foreground/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Accounts
                </span>
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCompactNumber(stats?.totalUsers ?? users.length)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeUsers ? `${stats.activeUsers} active now` : "Registered accounts"}
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
                    onClick={() => setIsConfirmingClearConcluded(true)}
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

                <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs w-full sm:w-auto">
                  {(["all", "active", "concluded"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`flex-1 sm:flex-initial text-center justify-center px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 select-none ${
                        statusFilter === tab
                          ? "bg-foreground text-background shadow-xs font-semibold"
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
                                  href={`/events/${(ev as any).slug || ev._id}`}
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
                                onClick={() => setEventToDelete({ id: ev._id, title: ev.title })}
                                disabled={deletingId === ev._id}
                                aria-label="Permanently delete from database"
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

              {/* Controls: Search & Tabs for Subscribers: All, Active, Unsubscribed */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email..."
                    value={subscriberSearchQuery}
                    onChange={(e) => setSubscriberSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-44 sm:w-56 rounded-full text-xs glass"
                  />
                </div>

                <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs">
                  {(["all", "subscribed", "unsubscribed"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSubscribersFilter(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 select-none ${
                        subscribersFilter === tab
                          ? "bg-foreground text-background shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab === "subscribed" ? "Active" : tab === "unsubscribed" ? "Unsubscribed" : "All"}
                    </button>
                  ))}
                </div>
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

          {/* Registered Users & Account Control (Ban / Unban) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  User Accounts Management ({formatCompactNumber(filteredUsers.length)})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Monitor registered users across Google and Email sign-in with instant suspension and unban control.
                </p>
              </div>

              {/* Controls: Search & Top Right Filters (All, Google, Email) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-44 sm:w-56 rounded-full text-xs glass"
                  />
                </div>

                <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs">
                  {(["all", "google", "email"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setUserProviderFilter(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150 select-none ${
                        userProviderFilter === tab
                          ? "bg-foreground text-background shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                {userSearchQuery || userProviderFilter !== "all"
                  ? "No user accounts match your search or provider filter."
                  : "No registered accounts found in the database."}
              </div>
            ) : (
              <div className="rounded-[26px] glass overflow-hidden border border-foreground/10 transition-opacity duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-foreground/5 text-muted-foreground font-semibold border-b border-foreground/10">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Login Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4 text-right">Account Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      {filteredUsers.map((acc) => {
                        const isBanned = acc.isBanned;
                        const isProcessing = banningUserId === acc._id;

                        return (
                          <tr
                            key={acc._id}
                            className="hover:bg-foreground/5 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-foreground">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 rounded-full border border-foreground/15 shrink-0 shadow-xs ring-1 ring-foreground/10 overflow-hidden">
                                  {acc.image ? (
                                    <AvatarImage
                                      src={getHighResImageUrl(acc.image)}
                                      alt={acc.name || "User"}
                                      referrerPolicy="no-referrer"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : null}
                                  <AvatarFallback className="text-xs font-semibold bg-foreground/10 text-foreground">
                                    {getFallbackAvatar(acc.name || acc.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[140px] sm:max-w-xs">{acc.name}</span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                              {acc.email}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  acc.provider === "google"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                    : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                                }`}
                              >
                                {acc.provider === "google" ? (
                                  <>
                                    <GoogleIcon className="h-3 w-3" />
                                    Google
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-3 w-3" />
                                    Email
                                  </>
                                )}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  isBanned || acc.status === "suspended"
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                    : acc.status === "active"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isBanned || acc.status === "suspended"
                                      ? "bg-rose-500 animate-pulse"
                                      : acc.status === "active"
                                      ? "bg-emerald-500 animate-pulse"
                                      : "bg-zinc-400"
                                  }`}
                                />
                                {isBanned || acc.status === "suspended"
                                  ? "Suspended"
                                  : acc.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {acc.createdAt ? formatDate(acc.createdAt) : "—"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isBanned ? "outline" : "destructive"}
                                  disabled={isProcessing}
                                  onClick={() => handleToggleBanUser(acc)}
                                  className={`rounded-full h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-xs transition-all cursor-pointer ${
                                    isBanned
                                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                                      : "bg-rose-600 hover:bg-rose-700 text-white"
                                  }`}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isBanned ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Unban User</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-3.5 w-3.5" />
                                      <span>Ban User</span>
                                    </>
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={isProcessing || acc.email === AUTHORIZED_ADMIN_EMAIL}
                                  onClick={() => setUserToDelete(acc)}
                                  className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors"
                                  title="Permanently Delete Account"
                                  aria-label={`Delete account for ${acc.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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

          {/* Section 1: Organizer Appeals & Strike Management (7-Day Probation & Suspensions) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Organizer Appeals &amp; Strike Management ({formatCompactNumber(strikeAppeals.length)})
                  </h2>
                  {pendingStrikeAppealsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse">
                      Action Required ({pendingStrikeAppealsCount})
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Review early event cancellations, organizer strike records, and 7-day probation cooling-off appeals.
                </p>
              </div>

              {/* Search Organizer & Top Right Filter Tabs for Section 1 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search name, email, appeal..."
                    value={appealSearchQuery}
                    onChange={(e) => setAppealSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-full glass border-foreground/10 focus-visible:ring-foreground/20"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-full glass border border-foreground/10 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setAppealTab("all")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer",
                      appealTab === "all"
                        ? "bg-foreground text-background shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppealTab("appeals")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1",
                      appealTab === "appeals"
                        ? "bg-amber-500 text-black shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Appeals (Msg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppealTab("approved")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer",
                      appealTab === "approved"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppealTab("rejected")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer",
                      appealTab === "rejected"
                        ? "bg-rose-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            {strikeAppeals.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                No organizers currently have active strike records or pending appeals.
              </div>
            ) : filteredStrikeAppeals.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                No records found under the &quot;{appealTab}&quot; filter.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1.5 focus:outline-hidden">
                {filteredStrikeAppeals.map((record) => {
                  const isPendingAppeal = record.appealRequest?.status === "pending";
                  const isExpanded = Boolean(expandedEmailHistory[record.userEmail]);
                  const historyCount = record.cancellationHistory?.length || 0;
                  const isApproving =
                    processingAppealAction?.email === record.userEmail &&
                    processingAppealAction?.action === "approve";
                  const isRejecting =
                    processingAppealAction?.email === record.userEmail &&
                    processingAppealAction?.action === "reject";

                  return (
                    <div
                      key={record.userEmail}
                      className={`rounded-[26px] glass p-5 sm:p-6 border transition-all ${
                        isPendingAppeal
                          ? "border-amber-500/50 shadow-lg shadow-amber-500/5"
                          : "border-foreground/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {record.userName || record.userEmail.split("@")[0]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({record.userEmail})
                            </span>
                            {record.stage === "suspended" && (
                              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-[10px] uppercase font-bold">
                                Suspended
                              </Badge>
                            )}
                            {record.stage === "probation" && (
                              <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/20 text-[10px] uppercase font-bold">
                                Probation
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Early cancellations recorded: <strong className="text-foreground">{record.earlyCancellations}</strong>
                            {record.stage === "probation" && (
                              <> &middot; Probation strikes: <strong className="text-amber-400">{record.probationStrikes || 0} / 2</strong></>
                            )}
                          </p>
                        </div>

                        {/* History Toggle Button */}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHistory(record.userEmail)}
                            className="rounded-full text-xs h-8 px-3 glass gap-1.5"
                          >
                            <span>Cancellation Reasons ({historyCount})</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Suspension or 7-Day Probation Appeal Request */}
                      {isPendingAppeal && record.appealRequest && (
                        <div className="mt-4 pt-4 border-t border-foreground/10 space-y-3">
                          <div className="glass-strong rounded-2xl p-4 border border-amber-500/30 space-y-2 bg-amber-500/5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                                <AlertOctagon className="h-3.5 w-3.5" />
                                {record.stage === "probation"
                                  ? "7-Day Probation Early Approval Request"
                                  : "Suspension Reinstatement Appeal Request"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Submitted {formatDate(record.appealRequest.requestedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-foreground italic leading-relaxed">
                              &ldquo;{record.appealRequest.message}&rdquo;
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              disabled={Boolean(processingAppealAction?.email === record.userEmail)}
                              onClick={() => handleApproveAppeal(record.userEmail)}
                              className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-4 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                            >
                              {isApproving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {record.stage === "probation"
                                  ? "Grant Early Approval"
                                  : "Approve & Place on Probation"}
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={Boolean(processingAppealAction?.email === record.userEmail)}
                              onClick={() => handleRejectAppeal(record.userEmail)}
                              className="rounded-full border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-8 px-4 text-xs font-medium gap-1.5 cursor-pointer"
                            >
                              {isRejecting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserX className="h-3.5 w-3.5" />
                              )}
                              <span>Reject Appeal</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Reviewed Appeal Status if not pending */}
                      {!isPendingAppeal && record.appealRequest?.status && (
                        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-semibold text-foreground">Appeal Status:</span>
                          <span
                            className={
                              record.appealRequest.status === "approved"
                                ? "text-emerald-500 font-medium"
                                : "text-rose-500 font-medium"
                            }
                          >
                            {record.appealRequest.status.toUpperCase()} &mdash;{" "}
                            {record.appealRequest.reviewNote || "Reviewed by administrator"}
                          </span>
                        </div>
                      )}

                      {/* Expanded Cancellation History */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-foreground/10 space-y-2">
                          <p className="text-xs font-semibold text-foreground">
                            Early Cancellation History &amp; Stated Reasons:
                          </p>
                          {historyCount === 0 ? (
                            <p className="text-xs text-muted-foreground">No history items logged.</p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                              {record.cancellationHistory?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="glass rounded-xl p-3 border border-foreground/5 space-y-1 text-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <span className="font-semibold text-foreground">
                                      {item.eventTitle}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      Cancelled {formatDate(item.cancelledAt)} (Scheduled: {formatDate(item.eventDate)})
                                    </span>
                                  </div>
                                  <div className="bg-background/40 p-2 rounded-lg text-muted-foreground">
                                    <strong className="text-foreground">Reason provided:</strong> &ldquo;{item.reason}&rdquo;
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: 2-Month Ban & Reinstatement Management */}
          <div className="space-y-4 pt-4 border-t border-foreground/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    2-Month Ban &amp; Reinstatement Management ({formatCompactNumber(twoMonthBans.length)})
                  </h2>
                  {pendingBanAppealsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                      Action Required ({pendingBanAppealsCount})
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Manage organizers serving 2-month suspension bans (2 probation strikes). Review 1-month early appeal notes or manually unban organizers to probation.
                </p>
              </div>

              {/* Search Organizer & Top Right Filter Tabs for Section 2 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search banned name, email, appeal..."
                    value={banSearchQuery}
                    onChange={(e) => setBanSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-full glass border-foreground/10 focus-visible:ring-foreground/20"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-full glass border border-foreground/10 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setBanTab("all")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer",
                      banTab === "all"
                        ? "bg-foreground text-background shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanTab("banned")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer",
                      banTab === "banned"
                        ? "bg-rose-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Active Bans
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanTab("appeals")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1",
                      banTab === "appeals"
                        ? "bg-amber-500 text-black shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    1-Month Appeals (Msg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanTab("restored")}
                    className={cn(
                      "flex-1 sm:flex-initial text-center justify-center px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer",
                      banTab === "restored"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Unbanned
                  </button>
                </div>
              </div>
            </div>

            {twoMonthBans.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                No organizers are currently serving a 2-month ban or have past ban records.
              </div>
            ) : filteredTwoMonthBans.length === 0 ? (
              <div className="glass p-8 rounded-[24px] text-center text-sm text-muted-foreground">
                No records found under the &quot;{banTab}&quot; filter.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1.5 focus:outline-hidden">
                {filteredTwoMonthBans.map((record) => {
                  const isExpanded = Boolean(expandedEmailHistory[record.userEmail]);
                  const historyCount = record.cancellationHistory?.length || 0;
                  const isUnbanning =
                    processingAppealAction?.email === record.userEmail &&
                    processingAppealAction?.action === "unban";
                  const isRejecting =
                    processingAppealAction?.email === record.userEmail &&
                    processingAppealAction?.action === "reject";
                  const isProcessing = processingAppealAction?.email === record.userEmail;

                  return (
                    <div
                      key={record.userEmail}
                      className={`rounded-[26px] glass p-5 sm:p-6 border transition-all ${
                        record.stage === "permanently_banned"
                          ? "border-destructive/30 shadow-lg shadow-destructive/5"
                          : "border-foreground/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {record.userName || record.userEmail.split("@")[0]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({record.userEmail})
                            </span>
                            {record.stage === "permanently_banned" ? (
                              <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px] uppercase font-bold">
                                2-Month Ban Active
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold">
                                Unbanned
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Probation cancellations: <strong className="text-rose-400">{record.probationStrikes || 2} / 2 (Triggered 2-month ban)</strong>
                            {record.bannedAt && (
                              <> &middot; Banned on: <span className="text-foreground">{formatDate(record.bannedAt)}</span></>
                            )}
                          </p>
                        </div>

                        {/* History Toggle Button */}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHistory(record.userEmail)}
                            className="rounded-full text-xs h-8 px-3 glass gap-1.5"
                          >
                            <span>Cancellation Reasons ({historyCount})</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* 1-Month Early Appeal Note Section (only if submitted AFTER the 2-month ban began) */}
                      {(() => {
                        const banAppeal =
                          record.stage === "permanently_banned" &&
                          record.appealRequest?.message &&
                          (!record.bannedAt ||
                            new Date(record.appealRequest.requestedAt).getTime() >=
                              new Date(record.bannedAt).getTime())
                            ? record.appealRequest
                            : null;

                        if (!banAppeal) return null;

                        return (
                          <div className="mt-4 pt-4 border-t border-destructive/20 space-y-3">
                            <div className="glass-strong rounded-2xl p-4 border border-amber-500/40 bg-amber-500/10 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                                  <Clock className="h-3.5 w-3.5" />
                                  1-Month Early Appeal Note from Banned Organizer
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Submitted {formatDate(banAppeal.requestedAt)}
                                </span>
                              </div>
                              <div className="bg-background/60 p-3 rounded-xl border border-amber-500/20 text-xs text-foreground italic leading-relaxed">
                                &ldquo;{banAppeal.message}&rdquo;
                              </div>
                              {banAppeal.status === "pending" ? (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={() => handleUnbanOrganizer(record.userEmail)}
                                    className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                                  >
                                    {isUnbanning ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <UserCheck className="h-3.5 w-3.5" />
                                    )}
                                    <span>Approve Note &amp; Unban to Probation (2.5 ★)</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={() => handleRejectAppeal(record.userEmail)}
                                    className="rounded-full border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-8 px-4 text-xs font-medium gap-1.5 cursor-pointer"
                                  >
                                    {isRejecting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <UserX className="h-3.5 w-3.5" />
                                    )}
                                    <span>Reject Note</span>
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                                  <span className="font-semibold text-foreground">Note Review Status:</span>
                                  <span
                                    className={
                                      banAppeal.status === "approved"
                                        ? "text-emerald-400 font-medium"
                                        : "text-rose-400 font-medium"
                                    }
                                  >
                                    {banAppeal.status.toUpperCase()} &mdash;{" "}
                                    {banAppeal.reviewNote || "Reviewed by administrator"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Expanded Cancellation History */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-foreground/10 space-y-2">
                          <p className="text-xs font-semibold text-foreground">
                            Cancellation History That Led to 2-Month Ban:
                          </p>
                          {historyCount === 0 ? (
                            <p className="text-xs text-muted-foreground">No history items logged.</p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                              {record.cancellationHistory?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="glass rounded-xl p-3 border border-foreground/5 space-y-1 text-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <span className="font-semibold text-foreground">
                                      {item.eventTitle}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      Cancelled {formatDate(item.cancelledAt)} (Scheduled: {formatDate(item.eventDate)})
                                    </span>
                                  </div>
                                  <div className="bg-background/40 p-2 rounded-lg text-muted-foreground">
                                    <strong className="text-foreground">Reason provided:</strong> &ldquo;{item.reason}&rdquo;
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Active Ban Info Banner when no appeal note */}
                      {record.stage === "permanently_banned" &&
                        (!record.appealRequest?.message ||
                          (record.bannedAt &&
                            new Date(record.appealRequest.requestedAt).getTime() <
                              new Date(record.bannedAt).getTime())) && (
                        <div className="mt-4 pt-4 border-t border-destructive/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-destructive/5 rounded-2xl p-4 border border-destructive/20">
                          <div className="space-y-0.5">
                            <p className="text-xs text-destructive font-semibold flex items-center gap-1.5">
                              <AlertOctagon className="h-3.5 w-3.5" />
                              Organizer is currently serving a 2-month ban.
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Administrator privilege allows overriding the ban and reinstating the organizer to probation immediately (starting at 2.5 ★ base).
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleUnbanOrganizer(record.userEmail)}
                            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-4 text-xs font-medium gap-1.5 shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
                          >
                            {isUnbanning ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            <span>Unban to Probation</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
              <div className="flex items-center rounded-full glass p-0.5 border border-foreground/10 text-xs w-full sm:w-auto">
                {(["all", "joined", "created", "deleted"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAuditFilter(tab)}
                    className={`flex-1 sm:flex-initial text-center justify-center px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 select-none ${
                      auditFilter === tab
                        ? "bg-foreground text-background shadow-xs font-semibold"
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

      {/* Custom Liquid Glass Modal for Single Event Permanent Deletion */}
      <AlertDialog
        open={Boolean(eventToDelete)}
        onOpenChange={(open) => {
          if (!open) setEventToDelete(null);
        }}
      >
        <AlertDialogContent className="glass-strong border border-rose-500/30 rounded-[28px] p-6 sm:p-8 max-w-md shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              Permanently Delete Event?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">
                &ldquo;{eventToDelete?.title}&rdquo;
              </strong>{" "}
              from the database? All volunteer join records for this event will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-3 pt-4 border-t border-foreground/10">
            <AlertDialogCancel
              disabled={Boolean(deletingId)}
              onClick={() => setEventToDelete(null)}
              className="rounded-full glass border-foreground/15 hover:bg-foreground/10 font-medium h-10 px-5 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(deletingId)}
              onClick={confirmDeleteEvent}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold h-10 px-5 shadow-md gap-2 cursor-pointer"
            >
              {deletingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Permanently Delete</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Custom Liquid Glass Modal for Clearing All Concluded Events */}
      <AlertDialog
        open={isConfirmingClearConcluded}
        onOpenChange={(open) => setIsConfirmingClearConcluded(open)}
      >
        <AlertDialogContent className="glass-strong border border-rose-500/30 rounded-[28px] p-6 sm:p-8 max-w-md shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              Remove All Concluded Events?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to remove <strong className="text-foreground font-semibold">ALL concluded events</strong> from the database? This action will permanently delete past completed initiatives and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-3 pt-4 border-t border-foreground/10">
            <AlertDialogCancel
              disabled={isClearingConcluded}
              onClick={() => setIsConfirmingClearConcluded(false)}
              className="rounded-full glass border-foreground/15 hover:bg-foreground/10 font-medium h-10 px-5 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearingConcluded}
              onClick={confirmClearConcluded}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold h-10 px-5 shadow-md gap-2 cursor-pointer"
            >
              {isClearingConcluded ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Delete All Concluded</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal for Permanent User Account Deletion */}
      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        <AlertDialogContent className="glass-strong border border-rose-500/30 rounded-[28px] p-6 sm:p-8 max-w-md shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              Permanently Delete User Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-foreground font-semibold">{userToDelete?.name}</strong> ({userToDelete?.email}) from the database? This will revoke active sessions and delete all account credentials permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-3 pt-4 border-t border-foreground/10">
            <AlertDialogCancel
              disabled={isDeletingUser}
              onClick={() => setUserToDelete(null)}
              className="rounded-full glass border-foreground/15 hover:bg-foreground/10 font-medium h-10 px-5 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingUser}
              onClick={handleConfirmDeleteUser}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold h-10 px-5 shadow-md gap-2 cursor-pointer"
            >
              {isDeletingUser ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Delete User</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
