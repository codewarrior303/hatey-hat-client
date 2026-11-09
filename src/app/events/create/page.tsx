"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { PrivateRoute } from "@/components/auth/private-route";
import { EventForm } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

interface OrganizerStatus {
  stage: "normal" | "suspended" | "probation" | "permanently_banned";
  earlyCancellations: number;
  probationStrikes: number;
  remainingStrikes: number;
  canCreate: boolean;
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
}

export default function CreateEventPage() {
  const [status, setStatus] = React.useState<OrganizerStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);
  const [appealMessage, setAppealMessage] = React.useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = React.useState(false);

  const fetchStatus = React.useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const res = await apiFetch<OrganizerStatus>("/api/organizers/status", {
        auth: true,
        skipCache: true,
      });
      setStatus(res.data);
    } catch {
      // Default to allowing creation if status check fails
      setStatus({
        stage: "normal",
        earlyCancellations: 0,
        probationStrikes: 0,
        remainingStrikes: 3,
        canCreate: true,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appealMessage.trim().length < 10) {
      toast.error("Please provide at least 10 characters explaining your appeal.");
      return;
    }

    try {
      setIsSubmittingAppeal(true);
      const res = await apiFetch<OrganizerStatus>("/api/organizers/appeal", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ message: appealMessage.trim() }),
      });
      toast.success("Appeal submitted! Administrator will review your request.");
      setStatus(res.data);
      setAppealMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit appeal.");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 max-w-4xl space-y-8 animate-in fade-in-50">
        <div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors glass rounded-full px-4 py-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Upcoming Events</span>
          </Link>
        </div>

        <div className="space-y-2 pb-6 border-b border-foreground/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Community Action
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Organize a New Social Event
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-2xl">
            Start a relief drive, neighbourhood cleanup, tree plantation, or
            healthcare camp. Volunteers across Bangladesh can view your event details and
            join as volunteers.
          </p>
        </div>

        {isLoadingStatus ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 glass rounded-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Verifying organizer authorization...</p>
          </div>
        ) : status?.stage === "permanently_banned" ? (
          /* Permanently Banned Screen */
          <div className="glass-strong border border-destructive/30 rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <XCircle className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Permanent Restriction
                </span>
                <h2 className="text-2xl font-semibold text-foreground">
                  Event Creation Privileges Permanently Revoked
                </h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account has exceeded the maximum allowable early cancellations during your reinstatement probation (2 strikes after administrator unlock). To preserve trust and safety for community volunteers across Bangladesh, you are permanently prohibited from publishing initiatives.
            </p>

            <div className="glass rounded-2xl p-5 space-y-2 border border-foreground/10">
              <p className="text-xs font-semibold text-foreground">Policy Notice</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Under the Hatey Hat community charter, repeated cancellations without conclusion disrupt volunteer commitments. Permanent revocations cannot be appealed.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/events">
                <Button className="rounded-full glass px-6 h-11 text-sm font-medium">
                  Browse Community Drives
                </Button>
              </Link>
            </div>
          </div>
        ) : status?.stage === "suspended" ? (
          /* Suspended Screen with Appeal Form or Pending Status */
          <div className="glass-strong border border-amber-500/30 rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                  Account Suspended (3/3 Strikes Reached)
                </span>
                <h2 className="text-2xl font-semibold text-foreground">
                  Event Creation Temporarily Suspended
                </h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              You have deleted 3 or more initiatives before their scheduled conclusion date. To maintain reliability for volunteers, your ability to organize new events has been locked.
            </p>

            {/* Appeal Section */}
            {status.appealRequest?.status === "pending" ? (
              <div className="glass rounded-2xl p-6 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Appeal Under Review
                  </span>
                </div>
                <p className="text-sm text-foreground font-medium">
                  Your reinstatement request was submitted and is pending administrator review.
                </p>
                <div className="bg-background/40 rounded-xl p-3 text-xs text-muted-foreground border border-foreground/10">
                  <strong className="text-foreground">Your Message:</strong> &ldquo;{status.appealRequest.message}&rdquo;
                </div>
                <p className="text-xs text-muted-foreground">
                  The administrator will review your past cancellation reasons. Once approved, your account will be placed on probation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAppeal} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Submit Reinstatement Appeal to Administrator
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {appealMessage.trim().length}/10 min chars
                    </span>
                  </div>
                  <Textarea
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    placeholder="Describe the circumstances that led to the early event cancellations and your commitment to upcoming drives..."
                    className="min-h-[120px] text-xs bg-background/50 border-foreground/15 rounded-2xl resize-none"
                    disabled={isSubmittingAppeal}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Your appeal along with all previous cancellation reasons will be submitted directly to the administrator for review.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingAppeal || appealMessage.trim().length < 10}
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6 font-medium gap-2 text-xs"
                >
                  {isSubmittingAppeal ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Appeal...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Appeal to Administrator
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* Normal or Probation: Render Event Form with Probation Warning if applicable */
          <div className="space-y-6">
            {status?.stage === "probation" && (
              <div className="glass-strong border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground">
                    Reinstated on Probation &mdash; {status.remainingStrikes} strike{status.remainingStrikes === 1 ? "" : "s"} remaining
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your event creation privileges were restored by the administrator. Please be advised that cancelling {status.remainingStrikes === 1 ? "1 more event" : "2 more events"} before conclusion will result in a <strong>permanent lifetime ban</strong> from organizing drives.
                  </p>
                </div>
              </div>
            )}

            <EventForm />
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
