"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import type { NotificationItem } from "@/types/notification";
import { CancellationDetailsModal } from "@/components/notifications/cancellation-details-modal";

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  openCancellationDetails: (notification: NotificationItem) => void;
  closeCancellationDetails: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isLoading] = React.useState<boolean>(false);

  // Modal state for viewing cancellation details
  const [selectedCancellation, setSelectedCancellation] = React.useState<NotificationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  // Track notifications that have already triggered an in-app alert in this session
  const alertedIdsRef = React.useRef<Set<string>>(new Set());
  const isFetchingRef = React.useRef<boolean>(false);

  // Reset alerted IDs when user account changes
  React.useEffect(() => {
    alertedIdsRef.current.clear();
  }, [user?.email]);

  const openCancellationDetails = React.useCallback((notification: NotificationItem) => {
    setSelectedCancellation(notification);
    setIsModalOpen(true);
  }, []);

  const closeCancellationDetails = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedCancellation(null);
  }, []);

  const fetchNotifications = React.useCallback(async () => {
    if (!user?.email) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Never poll database in background when browser tab is inactive/hidden
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    // Prevent overlapping concurrent fetch calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await apiFetch<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>("/api/notifications", {
        auth: true,
        skipCache: true,
      });

      if (res.data) {
        const list = res.data.notifications || [];
        const count = res.data.unreadCount || 0;
        setNotifications(list);
        setUnreadCount(count);

        // Check for new unread notifications that haven't been popped up as an in-app alert yet
        list.forEach((item) => {
          if (!item.isRead && !alertedIdsRef.current.has(item._id)) {
            alertedIdsRef.current.add(item._id);

            // Trigger native browser notification if available
            if (typeof window !== "undefined" && "Notification" in window) {
              const bodyText =
                item.type === "event_cancelled"
                  ? item.cancellationReason
                    ? `Reason: ${item.cancellationReason}`
                    : item.message
                  : item.message;

              if (Notification.permission === "granted") {
                try {
                  const n = new window.Notification(item.title, {
                    body: bodyText,
                    icon: item.eventThumbnail || "/favicon.svg",
                  });
                  n.onclick = () => {
                    window.focus();
                    if (item.type === "event_cancelled") {
                      openCancellationDetails(item);
                    } else if (item.type === "appeal_submitted") {
                      router.push("/admin");
                    } else if (item.type === "appeal_approved" || item.type === "account_unbanned") {
                      router.push("/events/create");
                    }
                  };
                } catch {
                  // Ignore
                }
              } else if (Notification.permission === "default") {
                try {
                  Notification.requestPermission().then((perm) => {
                    if (perm === "granted") {
                      const n = new window.Notification(item.title, {
                        body: bodyText,
                        icon: item.eventThumbnail || "/favicon.svg",
                      });
                      n.onclick = () => {
                        window.focus();
                        if (item.type === "event_cancelled") {
                          openCancellationDetails(item);
                        } else if (item.type === "appeal_submitted") {
                          router.push("/admin");
                        } else if (item.type === "appeal_approved" || item.type === "account_unbanned") {
                          router.push("/events/create");
                        }
                      };
                    }
                  });
                } catch {
                  // Ignore
                }
              }
            }

            // Display sleek in-app notification capsule matching navbar styling
            if (item.type === "event_cancelled") {
              toast(
                (t) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.dismiss(t.id);
                      openCancellationDetails(item);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:underline cursor-pointer text-left focus:outline-none"
                  >
                    <span className="font-semibold text-rose-500">Cancelled:</span>
                    <span className="truncate max-w-[190px] text-foreground">{item.eventTitle}</span>
                    <span className="text-[11px] text-rose-500 font-semibold ml-1">· View</span>
                  </button>
                ),
                { duration: 10000, id: `toast-${item._id}` }
              );
            } else if (item.type === "appeal_submitted") {
              toast(
                (t) => (
                  <a
                    href="/admin"
                    onClick={() => {
                      toast.dismiss(t.id);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:underline cursor-pointer text-left focus:outline-none"
                  >
                    <span className="font-semibold text-amber-500">Appeal Request:</span>
                    <span className="truncate max-w-[190px] text-foreground">
                      {item.organizerName || item.organizerEmail || "Organizer"}
                    </span>
                    <span className="text-[11px] text-amber-500 font-semibold ml-1">· Review</span>
                  </a>
                ),
                { duration: 12000, id: `toast-${item._id}` }
              );
            } else if (item.type === "appeal_approved") {
              toast.success("Appeal Approved! You can now organize events.", {
                duration: 4500,
                id: `toast-${item._id}`,
              });
            } else if (item.type === "appeal_rejected") {
              toast.error("Organizer appeal was reviewed and rejected.", {
                duration: 4500,
                id: `toast-${item._id}`,
              });
            } else if (item.type === "account_unbanned") {
              toast.success("Account Unbanned! Your organizer privileges have been restored.", {
                duration: 4500,
                id: `toast-${item._id}`,
              });
            } else {
              // Reminder milestone alert (24h, 12h, 1h)
              toast(
                () => (
                  <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                    <span className="font-semibold text-sky-500">
                      {item.type === "event_reminder_1h"
                        ? "1h Urgent:"
                        : item.type === "event_reminder_12h"
                        ? "12h Reminder:"
                        : "24h Reminder:"}
                    </span>
                    <span className="truncate max-w-[210px] text-foreground">{item.eventTitle}</span>
                  </div>
                ),
                { duration: 8000, id: `toast-${item._id}` }
              );
            }
          }
        });
      }
    } catch {
      // Non-fatal notification polling failure
    } finally {
      isFetchingRef.current = false;
    }
  }, [user?.email, openCancellationDetails, router]);

  // Initial load & Polling (15 seconds, pauses when tab is hidden)
  React.useEffect(() => {
    if (!user?.email) return;

    fetchNotifications();

    // Polling every 15 seconds for real-time notification delivery
    const interval = setInterval(fetchNotifications, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.email, fetchNotifications]);

  const markAsRead = React.useCallback(async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await apiFetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        auth: true,
      });
    } catch {
      // Silent error
    }
  }, []);

  const markAllAsRead = React.useCallback(async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await apiFetch("/api/notifications/read-all", {
        method: "PATCH",
        auth: true,
      });
    } catch {
      // Silent error
    }
  }, []);

  const deleteNotification = React.useCallback(async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));

      await apiFetch(`/api/notifications/${id}`, {
        method: "DELETE",
        auth: true,
      });
    } catch {
      // Silent error
    }
  }, []);

  const deleteAllNotifications = React.useCallback(async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);

      await apiFetch("/api/notifications/all", {
        method: "DELETE",
        auth: true,
      });
      toast.success("All notifications deleted!");
    } catch {
      toast.error("Failed to delete all notifications");
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        openCancellationDetails,
        closeCancellationDetails,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
      <CancellationDetailsModal
        notification={selectedCancellation}
        isOpen={isModalOpen}
        onClose={closeCancellationDetails}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
