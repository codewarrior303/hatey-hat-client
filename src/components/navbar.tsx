"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  PlusCircle,
  FolderKanban,
  CheckCircle2,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldCheck,
  Bell,
  ArrowLeft,
  CheckCheck,
  Trash2,
  CalendarX2,
  Clock,
  ChevronRight,
  AlertOctagon,
  UserCheck,
  UserX,
} from "lucide-react";
import toast, { useToaster, resolveValue } from "react-hot-toast";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNotifications } from "@/context/notification-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { invalidateCache } from "@/lib/api";
import { cn, getFallbackAvatar } from "@/lib/utils";

function getRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return "";
  const now = Date.now();
  const time = new Date(dateInput).getTime();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(dateInput).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function NotificationsPanel({
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  openCancellationDetails,
  onClose,
  showBackToMenu,
  onBackToMenu,
}: {
  notifications: any[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  openCancellationDetails: (notif: any) => void;
  onClose: () => void;
  showBackToMenu?: boolean;
  onBackToMenu?: () => void;
}) {
  const router = useRouter();

  return (
    <div
      className="w-[330px] p-0 shrink-0 flex flex-col"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between px-3.5 py-2.5 border-b border-foreground/10 bg-foreground/[0.02]">
        {/* Left: Back or Title */}
        <div className="flex items-center gap-2">
          {showBackToMenu ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBackToMenu?.();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-foreground/5 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Menu</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Notifications</span>
            </div>
          )}
        </div>

        {/* Middle: Professional Centered Counter */}
        {unreadCount > 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
              {unreadCount}
            </span>
          </div>
        )}

        {/* Right: Read all / Delete all button with slight padding away from right edge */}
        <div className="flex items-center pr-1.5">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-foreground/5"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Read all</span>
            </button>
          ) : notifications.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteAllNotifications();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 hover:text-rose-400 transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-rose-500/10"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete all</span>
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>
      </div>

      {/* Notifications List inside dropdown - Isolated scrolling */}
      <div className="max-h-[350px] min-h-[220px] overflow-y-auto overscroll-contain divide-y divide-foreground/5 p-1.5 focus:outline-hidden">
        {notifications.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-1.5">
            <div className="h-9 w-9 mx-auto rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground">
              <Bell className="h-4 w-4 opacity-40" />
            </div>
            <p className="text-xs font-semibold text-foreground">All caught up!</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              No new alerts. You will receive real-time updates here for event reminders, cancellations, and appeal status.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isCancelled = notif.type === "event_cancelled";
            const isAppealSubmitted = notif.type === "appeal_submitted";
            const isAppealApproved = notif.type === "appeal_approved";
            const isAppealRejected = notif.type === "appeal_rejected";
            const isUnbanned = notif.type === "account_unbanned";

            return (
              <div
                key={notif._id}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!notif.isRead) {
                    await markAsRead(notif._id);
                  }
                  onClose();
                  if (isCancelled) {
                    openCancellationDetails(notif);
                  } else if (isAppealSubmitted) {
                    router.push("/admin");
                  } else if (isAppealApproved || isUnbanned) {
                    router.push("/events/create");
                  } else if (notif.eventId) {
                    router.push(`/events/${notif.eventId}`);
                  }
                }}
                className={cn(
                  "relative group p-2.5 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-foreground/[0.04]",
                  !notif.isRead
                    ? isCancelled || isAppealRejected
                      ? "bg-rose-500/[0.05]"
                      : isAppealSubmitted
                      ? "bg-amber-500/[0.05]"
                      : isAppealApproved || isUnbanned
                      ? "bg-emerald-500/[0.05]"
                      : "bg-foreground/[0.02]"
                    : ""
                )}
              >
                <div
                  className={cn(
                    "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs mt-0.5 border",
                    isCancelled || isAppealRejected
                      ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                      : isAppealSubmitted
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      : isAppealApproved || isUnbanned
                      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      : "bg-sky-500/15 text-sky-500 border-sky-500/30"
                  )}
                >
                  {isCancelled ? (
                    <CalendarX2 className="h-3.5 w-3.5" />
                  ) : isAppealSubmitted ? (
                    <AlertOctagon className="h-3.5 w-3.5" />
                  ) : isAppealApproved || isUnbanned ? (
                    <UserCheck className="h-3.5 w-3.5" />
                  ) : isAppealRejected ? (
                    <UserX className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded",
                        isCancelled || isAppealRejected
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isAppealSubmitted
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : isAppealApproved || isUnbanned
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : notif.type === "event_reminder_1h"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      )}
                    >
                      {isCancelled
                        ? "Cancelled"
                        : isAppealSubmitted
                        ? "Appeal Request"
                        : isAppealApproved
                        ? "Reinstated"
                        : isUnbanned
                        ? "Unbanned"
                        : isAppealRejected
                        ? "Appeal Rejected"
                        : notif.type === "event_reminder_1h"
                        ? "1h Urgent"
                        : notif.type === "event_reminder_12h"
                        ? "12h Reminder"
                        : "24h Reminder"}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">
                    {notif.eventTitle || notif.title}
                  </p>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {isCancelled
                      ? `Reason: ${notif.cancellationReason || notif.message}`
                      : notif.message}
                  </p>

                  {isCancelled && (
                    <span className="text-[10px] font-semibold text-rose-500 inline-flex items-center gap-0.5 pt-0.5 hover:underline">
                      <span>View cancellation statement</span>
                      <ChevronRight className="h-2.5 w-2.5" />
                    </span>
                  )}

                  {isAppealSubmitted && (
                    <span className="text-[10px] font-semibold text-amber-500 inline-flex items-center gap-0.5 pt-0.5 hover:underline">
                      <span>Review in Admin Panel</span>
                      <ChevronRight className="h-2.5 w-2.5" />
                    </span>
                  )}

                  {isAppealApproved && (
                    <span className="text-[10px] font-semibold text-emerald-500 inline-flex items-center gap-0.5 pt-0.5 hover:underline">
                      <span>Start an Initiative</span>
                      <ChevronRight className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1 self-center">
                  {!notif.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteNotification(notif._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    openCancellationDetails,
  } = useNotifications();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [dropdownView, setDropdownView] = React.useState<"menu" | "notifications">("menu");
  const [mobileView, setMobileView] = React.useState<"menu" | "notifications">("menu");

  // Subscribe to react-hot-toast notifications with unique ID tracking (allows multiple stacked toast notifications)
  const { toasts } = useToaster();
  const activeToasts = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: typeof toasts = [];
    for (const t of toasts) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
      if (unique.length >= 4) break;
    }
    return unique;
  }, [toasts]);

  // Auto-close dropdown & reset views when changing route or returning
  React.useEffect(() => {
    setDropdownOpen(false);
    setDropdownView("menu");
    setMobileOpen(false);
    setMobileView("menu");
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    }
  }, [pathname]);

  React.useEffect(() => {
    if (!dropdownOpen) {
      setDropdownView("menu");
    }
  }, [dropdownOpen]);

  React.useEffect(() => {
    if (!mobileOpen) {
      setMobileView("menu");
    }
  }, [mobileOpen]);

  React.useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const user = session?.user;

  const handleLogout = async () => {
    try {
      await signOut();
      invalidateCache();
      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  };

  const navLinks = [
    {
      href: "/events",
      label: "Upcoming Events",
      icon: CalendarDays,
    },
  ];

  const userMenuItems = [
    { href: "/events/create", label: "Create Event", icon: PlusCircle },
    { href: "/events/manage", label: "Manage Events", icon: FolderKanban },
    { href: "/events/joined", label: "Joined Events", icon: CheckCircle2 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-3 z-50 w-full px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="relative mx-auto max-w-2xl">
        <div
          className={cn(
            "relative pointer-events-auto rounded-full transition-colors duration-200 px-3.5 sm:px-6 h-14 flex items-center justify-between w-full",
            isScrolled ? "glass-strong shadow-md" : "glass shadow-xs",
          )}
        >
          {/* Brand Logo with fixed minimum width for symmetry */}
          <div className="flex items-center shrink-0 min-w-[130px]">
            <BrandLogo />
          </div>

          {/* Desktop Navigation (Pinned to exact dead center of navbar pill - never shifts on refresh) */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] font-medium transition-all",
                    isActive
                      ? "bg-foreground/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                  )}
                >
                  <Icon className="h-4 w-4 opacity-70" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions (Desktop) with fixed minimum width to eliminate layout shift */}
          <div className="hidden md:flex items-center justify-end gap-2.5 min-w-[130px] shrink-0">
            <ThemeToggle />

            {isPending && !user ? (
              <div className="h-8 w-20 rounded-full bg-foreground/5 animate-pulse shrink-0" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Profile dropdown */}
                <div className="relative group">
                    <DropdownMenu
                      modal={false}
                      open={dropdownOpen}
                      onOpenChange={(open) => {
                        setDropdownOpen(open);
                        if (!open) {
                          if (typeof document !== "undefined") {
                            document.body.style.overflow = "";
                          }
                          setTimeout(() => setDropdownView("menu"), 250);
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="relative rounded-full focus:outline-none focus-visible:outline-none transition-transform hover:scale-105"
                          aria-label={`User menu for ${user.name || user.email}`}
                        >
                          <Avatar className="h-9 w-9 border border-foreground/15">
                            {user.image && (
                              <AvatarImage
                                src={user.image}
                                alt={user.name || "User"}
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <AvatarFallback className="text-xs font-semibold">
                              {getFallbackAvatar(user.name || user.email)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Unread notification count on top of Avatar */}
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse pointer-events-none">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className={cn(
                          "glass-menu shadow-2xl p-0 overflow-hidden rounded-2xl border border-foreground/15 transition-[width] duration-200 ease-out",
                          dropdownView === "notifications" ? "w-[330px]" : "w-[224px]"
                        )}
                      >
                        {dropdownView === "menu" ? (
                          /* Panel 1: Compact Menu - Wraps tightly with zero dead space below Log Out */
                          <div className="w-[224px] p-2 flex flex-col">
                            <DropdownMenuLabel className="font-normal px-2 py-1.5">
                              <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-foreground truncate">
                                  {user.name || "Community Member"}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-foreground/10 my-1" />

                            {/* Notifications Switcher button inside Avatar Menu */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDropdownView("notifications");
                              }}
                              className="w-full rounded-xl px-2.5 py-2 cursor-pointer hover:bg-foreground/10 flex items-center justify-between group transition-colors text-left"
                            >
                              <div className="flex items-center gap-2.5 text-sm">
                                <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <span className="font-medium text-foreground">Notifications</span>
                              </div>
                              {unreadCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                                  {unreadCount} new
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground opacity-60">0</span>
                              )}
                            </button>

                            <DropdownMenuSeparator className="bg-foreground/10 my-1" />

                            {userMenuItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <DropdownMenuItem
                                  key={item.href}
                                  asChild
                                  onSelect={() => setDropdownOpen(false)}
                                  className="rounded-xl px-2.5 py-2 cursor-pointer focus:bg-foreground/10"
                                >
                                  <Link
                                    href={item.href}
                                    className="flex items-center gap-2.5 text-sm"
                                  >
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span>{item.label}</span>
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}

                            {user.email?.toLowerCase().trim() ===
                              "abirahnafshahriar@gmail.com" && (
                              <>
                                <DropdownMenuSeparator className="bg-foreground/10 my-1" />
                                <DropdownMenuItem
                                  asChild
                                  onSelect={() => setDropdownOpen(false)}
                                  className="rounded-xl px-2.5 py-2 cursor-pointer focus:bg-foreground/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                >
                                  <Link
                                    href="/admin"
                                    className="flex items-center gap-2.5 text-sm"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Admin Panel</span>
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator className="bg-foreground/10 my-1" />
                            <DropdownMenuItem
                              onClick={handleLogout}
                              className="rounded-xl px-2.5 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2.5 text-sm"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Log Out</span>
                            </DropdownMenuItem>
                          </div>
                        ) : (
                          /* Panel 2: Notifications */
                          <NotificationsPanel
                            notifications={notifications}
                            unreadCount={unreadCount}
                            markAsRead={markAsRead}
                            markAllAsRead={markAllAsRead}
                            deleteNotification={deleteNotification}
                            deleteAllNotifications={deleteAllNotifications}
                            openCancellationDetails={openCancellationDetails}
                            onClose={() => setDropdownOpen(false)}
                            showBackToMenu
                            onBackToMenu={() => {
                              if (typeof document !== "undefined") {
                                document.body.style.overflow = "";
                              }
                              setDropdownView("menu");
                            }}
                          />
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clean Hover Tooltip: Only on mouse hover, zero interference with dropdown */}
                    {!dropdownOpen && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 opacity-0 group-hover:opacity-100 transition-all duration-150 transform scale-95 group-hover:scale-100 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border border-white/10 dark:border-black/10 select-none"
                      >
                        {user.name || user.email}
                      </div>
                    )}
                  </div>

                  {/* Direct Logout Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1.5 text-xs h-8 px-3 rounded-full transition-colors hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 group"
                  >
                    <LogOut className="h-3.5 w-3.5 transition-colors group-hover:text-red-500" />
                    <span className="transition-colors group-hover:text-red-500">
                      Logout
                    </span>
                  </Button>
                </div>
            ) : pathname === "/admin" ? (
              /* On Admin Page: Sign In button in navbar is disabled when unauthenticated */
              <Button
                disabled
                size="sm"
                className="gap-2 h-9 px-4 font-medium opacity-50 cursor-not-allowed pointer-events-none select-none"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-2 h-9 px-4 font-medium">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full relative"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-4 w-4" />
                  {/* Subtle indicator dot on mobile menu button if unread notifications */}
                  {user && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-72 glass-strong border-border/40 p-6 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <SheetHeader className="text-left pb-4 border-b border-border/40">
                    <SheetTitle>
                      <BrandLogo onClick={() => setMobileOpen(false)} />
                    </SheetTitle>
                  </SheetHeader>

                  {user && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-2xl glass">
                        <Avatar className="h-10 w-10 border border-foreground/20">
                          {user.image && (
                            <AvatarImage
                              src={user.image}
                              alt={user.name || "User"}
                            />
                          )}
                          <AvatarFallback>
                            {getFallbackAvatar(user.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate">
                            {user.name || "Community Member"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Notifications trigger inside mobile menu */}
                      <button
                        type="button"
                        onClick={() => {
                          setMobileView("notifications");
                        }}
                        className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl glass text-sm font-medium hover:bg-foreground/5 text-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span>Notifications</span>
                        </div>
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
                            {unreadCount} new
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground opacity-60">0</span>
                        )}
                      </button>
                    </div>
                  )}

                  {mobileView === "notifications" ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between pb-2 border-b border-foreground/10">
                        <button
                          type="button"
                          onClick={() => setMobileView("menu")}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-foreground/5"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Back to Menu</span>
                        </button>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-muted-foreground">
                            No notifications right now.
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isCancelled = notif.type === "event_cancelled";
                            const isAppealSubmitted = notif.type === "appeal_submitted";
                            const isAppealApproved = notif.type === "appeal_approved";
                            const isAppealRejected = notif.type === "appeal_rejected";
                            const isUnbanned = notif.type === "account_unbanned";

                            return (
                              <div
                                key={notif._id}
                                onClick={async () => {
                                  if (!notif.isRead) await markAsRead(notif._id);
                                  setMobileOpen(false);
                                  if (isCancelled) openCancellationDetails(notif);
                                  else if (isAppealSubmitted) router.push("/admin");
                                  else if (isAppealApproved || isUnbanned) router.push("/events/create");
                                  else if (notif.eventId) router.push(`/events/${notif.eventId}`);
                                }}
                                className="p-3 rounded-2xl glass space-y-1.5 cursor-pointer hover:bg-foreground/5 transition-colors"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span
                                    className={
                                      isCancelled || isAppealRejected
                                        ? "text-rose-500 font-bold"
                                        : isAppealSubmitted
                                        ? "text-amber-500 font-bold"
                                        : isAppealApproved || isUnbanned
                                        ? "text-emerald-500 font-bold"
                                        : "text-sky-500 font-bold"
                                    }
                                  >
                                    {isCancelled
                                      ? "CANCELLED"
                                      : isAppealSubmitted
                                      ? "APPEAL REQUEST"
                                      : isAppealApproved
                                      ? "REINSTATED"
                                      : isUnbanned
                                      ? "UNBANNED"
                                      : isAppealRejected
                                      ? "REJECTED"
                                      : "REMINDER"}
                                  </span>
                                  <span className="text-muted-foreground">{getRelativeTime(notif.createdAt)}</span>
                                </div>
                                <p className="text-xs font-semibold text-foreground line-clamp-1">{notif.eventTitle || notif.title}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                  {isCancelled ? `Reason: ${notif.cancellationReason || notif.message}` : notif.message}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                          Explore
                        </p>
                        {navLinks.map((link) => {
                          const Icon = link.icon;
                          const isActive = pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-foreground text-background"
                                  : "hover:bg-foreground/5 text-foreground",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{link.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      {user && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                            Dashboard
                          </p>
                          {userMenuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                                  isActive
                                    ? "bg-foreground text-background"
                                    : "hover:bg-foreground/5 text-foreground",
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}

                          {user.email?.toLowerCase().trim() ===
                            "abirahnafshahriar@gmail.com" && (
                            <Link
                              href="/admin"
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-colors text-emerald-600 dark:text-emerald-400 hover:bg-foreground/5",
                                pathname === "/admin" && "bg-emerald-500/15"
                              )}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-6 border-t border-border/40">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </Button>
                  ) : pathname === "/admin" ? (
                    <Button
                      disabled
                      className="w-full justify-center gap-2 opacity-50 cursor-not-allowed pointer-events-none"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full justify-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/login">
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Live Notification Container - Sits side-by-side with navbar on desktop (left: 100% + 12px), centered below on smaller screens */}
        {activeToasts.length > 0 && (
          <div className="pointer-events-none z-50 flex flex-col items-center xl:items-start gap-2 absolute top-full mt-2.5 left-1/2 -translate-x-1/2 xl:top-0 xl:mt-0 xl:left-full xl:ml-3 xl:translate-x-0 max-w-[calc(100vw-2rem)]">
            {activeToasts.map((t) => (
              <div
                key={t.id}
                role="alert"
                className={cn(
                  "pointer-events-auto flex items-center justify-between gap-3 rounded-full pl-4 pr-3 py-1.5 text-xs sm:text-sm font-medium border shadow-lg backdrop-blur-2xl transition-all duration-300",
                  isScrolled ? "glass-strong shadow-md" : "glass shadow-xs",
                  "max-w-[calc(100vw-3rem)] xl:max-w-none whitespace-nowrap",
                  t.type === "error"
                    ? "border-red-500/50 text-foreground"
                    : "border-foreground/15 text-foreground",
                  t.visible
                    ? "toast-enter-animation h-14 min-h-14 max-h-14 opacity-100"
                    : "toast-exit-animation pointer-events-none min-h-0 overflow-hidden border-transparent opacity-0",
                )}
              >
                {/* Clean notification message text - single line, never awkwardly wrapping on desktop or mobile */}
                <span className="text-foreground font-medium text-xs sm:text-sm select-none whitespace-nowrap truncate max-w-[280px] sm:max-w-xs xl:max-w-sm">
                  {resolveValue(t.message, t)}
                </span>

                {/* Cross Button to instantly dismiss notification */}
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer shrink-0 ml-1"
                  aria-label="Remove notification"
                  title="Remove notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
