"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  MapPin,
  User,
  ArrowRight,
  X,
  ShieldAlert,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/types/notification";
import { formatDate } from "@/lib/utils";

interface CancellationDetailsModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CancellationDetailsModal({
  notification,
  isOpen,
  onClose,
}: CancellationDetailsModalProps) {
  if (!notification || notification.type !== "event_cancelled") return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-lg p-6 sm:p-7 rounded-[28px] border border-rose-500/20 bg-background/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Event Cancelled</span>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {notification.eventTitle}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            This community initiative has been officially cancelled by its organizer. Below are the cancellation details and the official statement provided.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-2">
          {/* Official Cancellation Reason Callout */}
          <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Official Reason for Cancellation</span>
            </div>
            <p className="text-sm font-medium text-foreground italic leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-rose-500/40">
              &ldquo;{notification.cancellationReason || "No specific reason provided by organizer."}&rdquo;
            </p>
          </div>

          {/* Event Metadata Snapshot - Full width, clean formatting without truncation */}
          <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/10 text-xs text-muted-foreground">
            {notification.eventDate && (
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 text-foreground/70 shrink-0" />
                <span className="font-medium text-foreground">
                  Scheduled: {formatDate(notification.eventDate)}
                </span>
              </div>
            )}

            {notification.eventLocation && (
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-foreground/70 shrink-0" />
                <span>Venue: {notification.eventLocation}</span>
              </div>
            )}

            {notification.organizerName && (
              <div className="flex items-center gap-2.5 border-t border-foreground/5 pt-2 mt-0.5">
                <User className="h-4 w-4 text-foreground/70 shrink-0" />
                <span>
                  Organizer: <strong className="text-foreground font-medium">{notification.organizerName}</strong>
                  {notification.organizerEmail && (
                    <span className="opacity-80"> ({notification.organizerEmail})</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Helpful Volunteer Reassurance Note */}
          <p className="text-xs text-muted-foreground/90 leading-relaxed bg-foreground/[0.02] p-3 rounded-xl border border-foreground/5">
            💡 <strong>Notice for registered volunteers:</strong> Your registration for this event has been automatically released. You are no longer expected to attend. Thank you for your readiness to support the community.
          </p>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            className="rounded-full h-10 px-5 glass border-foreground/15 text-foreground"
            onClick={onClose}
          >
            <Link href="/events" className="inline-flex items-center gap-2">
              <span>Explore Other Events</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          <Button
            onClick={onClose}
            className="rounded-full h-10 px-6 font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Understood
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
