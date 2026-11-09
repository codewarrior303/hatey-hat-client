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
  canAppeal?: boolean;
  isProbationWaiting?: boolean;
  probationWaitEndsAt?: string;
  probationWaitDaysRemaining?: number;
  appealCooldownDaysRemaining?: number;
  appealCooldownHoursRemaining?: number;
  appealAvailableAt?: string;
  bannedAt?: string;
  banEndsAt?: string;
  canEarlyAppeal?: boolean;
  earlyAppealAvailableAt?: string;
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

function ProbationCountdownTimer({
  targetDate,
  onComplete,
}: {
  targetDate: string;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });

  React.useEffect(() => {
    const calc = () => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const totalMs = Math.max(0, target - now);

      const totalSec = Math.floor(totalMs / 1000);
      const seconds = totalSec % 60;
      const totalMin = Math.floor(totalSec / 60);
      const minutes = totalMin % 60;
      const totalHours = Math.floor(totalMin / 60);
      const hours = totalHours % 24;
      const days = Math.floor(totalHours / 24);

      setTimeLeft({ days, hours, minutes, seconds, totalMs });

      if (totalMs === 0 && onComplete) {
        onComplete();
      }
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground px-1 gap-1">
        <span className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-sky-400" />
          Probation Cooling-Off Countdown (7 Days)
        </span>
        <span className="text-[11px] text-muted-foreground">
          Auto-approves when countdown reaches zero
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl glass border border-foreground/10 text-center">
        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Days
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Hours
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Mins
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <span className="text-xl sm:text-2xl font-extrabold text-sky-400 font-mono animate-pulse">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-sky-400 uppercase font-bold tracking-wider">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}

function BanCountdownTimer({
  targetDate,
  onComplete,
}: {
  targetDate: string;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = React.useState<{
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 1 });

  React.useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const totalMs = Math.max(0, target - now);

      const totalSec = Math.floor(totalMs / 1000);
      const seconds = totalSec % 60;
      const totalMin = Math.floor(totalSec / 60);
      const minutes = totalMin % 60;
      const totalHours = Math.floor(totalMin / 60);
      const hours = totalHours % 24;
      const totalDays = Math.floor(totalHours / 24);
      const months = Math.floor(totalDays / 30);
      const days = totalDays % 30;

      setTimeLeft({ months, days, hours, minutes, seconds, totalMs });

      if (totalMs === 0 && onComplete) {
        onComplete();
      }
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground px-1 gap-1">
        <span className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          Automatic Ban Removal Countdown (2 Months)
        </span>
        <span className="text-[11px] text-muted-foreground">
          Auto-unbans after 60 days
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl glass border border-foreground/10 text-center">
        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.months).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Months
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Days
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Hours
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-foreground/5 border border-foreground/5">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Mins
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-xl sm:text-2xl font-extrabold text-amber-500 font-mono animate-pulse">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-amber-500 uppercase font-bold tracking-wider">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}

function validateAppealMessage(text: string): { valid: boolean; message: string } {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 3 || trimmed.length < 15) {
    return {
      valid: false,
      message: "Please write a meaningful statement explaining the context (at least 3 descriptive words)",
    };
  }
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s+/g, "")).size;
  if (uniqueChars < 5) {
    return {
      valid: false,
      message: "Please write a genuine, meaningful appeal for review",
    };
  }
  return { valid: true, message: "Meaningful statement provided" };
}

export default function CreateEventPage() {
  const [status, setStatus] = React.useState<OrganizerStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);
  const [appealMessage, setAppealMessage] = React.useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = React.useState(false);

  const appealValidation = React.useMemo(() => validateAppealMessage(appealMessage), [appealMessage]);

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
    if (!appealValidation.valid) {
      toast.error(appealValidation.message);
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
      <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-12 max-w-4xl space-y-8 animate-in fade-in-50">
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
            Start a relief initiative, neighbourhood cleanup, tree plantation, or
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
          /* Permanently Banned Screen with 2-Month Countdown & 1-Month Early Appeal */
          <div className="glass-strong border border-destructive/30 rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <XCircle className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  2-Month Restriction Active
                </span>
                <h2 className="text-2xl font-semibold text-foreground">
                  Event Creation Temporarily Revoked (2 Months)
                </h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account exceeded the maximum allowable early cancellations during your probation period (2 strikes). To preserve volunteer reliability across Bangladesh, event creation privileges are revoked for 2 months.
            </p>

            {/* Live 2-Month Countdown Timer (Month : Day : Hour : Min : Sec) */}
            {status.banEndsAt && (
              <BanCountdownTimer
                targetDate={status.banEndsAt}
                onComplete={fetchStatus}
              />
            )}

            {/* 1-Month Milestone Early Appeal to Admin */}
            {status.appealRequest?.status === "pending" ? (
              <div className="glass rounded-2xl p-5 border border-amber-500/30 space-y-2 bg-amber-500/5">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Early Reinstatement Appeal Under Review
                </span>
                <p className="text-xs text-foreground font-medium">
                  Your early appeal request was submitted to the platform administrator.
                </p>
                <div className="bg-background/40 p-3 rounded-xl border border-foreground/10 text-xs italic text-muted-foreground">
                  &ldquo;{status.appealRequest.message}&rdquo;
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The administrator will review your message. If not approved early, automatic reinstatement will occur as soon as the 2-month countdown reaches zero.
                </p>
              </div>
            ) : status.canEarlyAppeal ? (
              <div className="glass rounded-2xl p-6 border border-amber-500/30 space-y-4 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-500">
                  <ShieldAlert className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    1-Month Milestone Reached &mdash; Early Appeal Unlocked
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have completed 1 month of your 2-month ban period. You can now submit an early reinstatement message directly to the administrator for review.
                </p>
                <div className="space-y-3">
                  <Textarea
                    placeholder="State your reasons for requesting early reinstatement and your commitment to on-time event completion..."
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    className="min-h-[100px] text-xs glass border-foreground/15 rounded-xl resize-none"
                    disabled={isSubmittingAppeal}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {appealValidation.message}
                    </span>
                    <Button
                      type="button"
                      disabled={!appealValidation.valid || isSubmittingAppeal}
                      onClick={handleSubmitAppeal}
                      className="rounded-full gap-2 text-xs h-9 px-5 shadow-xs cursor-pointer"
                    >
                      {isSubmittingAppeal ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Submit Early Appeal</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-4 border border-foreground/10 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    Early administrative appeal unlocks after 1 month of ban duration. Full automatic reinstatement activates in 2 months.
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                asChild
                className="rounded-full !bg-white !text-black hover:!bg-white/90 px-6 h-11 text-sm font-semibold shadow-md cursor-pointer select-none"
              >
                <Link href="/events">
                  Browse Community Events
                </Link>
              </Button>
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
            ) : status.appealRequest?.status === "rejected" && (status.appealCooldownDaysRemaining ?? 0) > 0 ? (
              <div className="glass rounded-2xl p-6 border border-rose-500/30 space-y-4 bg-rose-500/5">
                <div className="flex items-center gap-2 text-rose-500">
                  <XCircle className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Appeal Rejected &mdash; 7-Day Waiting Period Active
                  </span>
                </div>
                <p className="text-sm text-foreground font-medium leading-relaxed">
                  Your previous appeal was reviewed and rejected by the administrator.
                </p>
                <div className="bg-background/40 rounded-xl p-3.5 text-xs text-muted-foreground border border-foreground/10 space-y-1.5">
                  {status.appealRequest.reviewNote && (
                    <p>
                      <strong className="text-foreground">Review Note:</strong> {status.appealRequest.reviewNote}
                    </p>
                  )}
                  <p>
                    Under community guidelines, you must wait 7 days before you can submit a new reinstatement appeal.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-amber-500 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Next appeal opens in: {status.appealCooldownDaysRemaining} day(s)</span>
                  </div>
                </div>
                <div className="pt-1">
                  <Link href="/events">
                    <Button variant="outline" className="rounded-full glass text-xs h-9 px-4">
                      Explore Existing Events
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAppeal} className="space-y-4 pt-2">
                {status.appealRequest?.status === "rejected" && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500">
                    Your 7-day waiting period has elapsed. You can now submit a new appeal for administrator review.
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Submit Reinstatement Appeal to Administrator
                    </label>
                    <span
                      className={`text-[11px] font-medium transition-colors ${
                        appealValidation.valid
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }`}
                    >
                      {appealValidation.valid
                        ? "✓ Meaningful statement"
                        : "Please write a meaningful statement"}
                    </span>
                  </div>
                  <Textarea
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    placeholder="Describe the circumstances that led to the early event cancellations and your commitment to upcoming events..."
                    className="min-h-[120px] text-xs bg-background/50 border-foreground/15 rounded-2xl resize-none"
                    disabled={isSubmittingAppeal}
                  />
                  {!appealValidation.valid && appealMessage.trim().length > 0 && (
                    <p className="text-[11px] text-amber-500 font-medium">
                      {appealValidation.message}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Your appeal along with all previous cancellation reasons will be submitted directly to the administrator for review.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingAppeal || !appealValidation.valid}
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
        ) : status?.stage === "probation" && status?.isProbationWaiting ? (
          /* Probation 7-Day Cooling Off Screen with Countdown & Message Admin Option */
          <div className="glass-strong border border-sky-500/30 rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Probation Cooling-Off Active
                </span>
                <h2 className="text-2xl font-semibold text-foreground">
                  7-Day Probation Waiting Period
                </h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account has entered administrator probation. Under platform reliability guidelines, newly restored accounts observe a standard 7-day cooling-off period before creating events.
            </p>

            {/* Live 7-Day Countdown Timer */}
            {status.probationWaitEndsAt && (
              <ProbationCountdownTimer
                targetDate={status.probationWaitEndsAt}
                onComplete={fetchStatus}
              />
            )}

            {/* Message Administrator Option for Early Approval */}
            {status.appealRequest?.status === "pending" ? (
              <div className="glass rounded-2xl p-5 border border-sky-500/30 space-y-2 bg-sky-500/5">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Early Approval Message Under Review
                </span>
                <p className="text-xs text-foreground font-medium">
                  Your message was sent to the administrator requesting early event creation approval.
                </p>
                <div className="bg-background/40 p-3 rounded-xl border border-foreground/10 text-xs italic text-muted-foreground">
                  &ldquo;{status.appealRequest.message}&rdquo;
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The administrator will review your message. If approved early, your event creation will unlock immediately. If no administrative action is taken, your privileges will automatically approve once the 7-day timer finishes.
                </p>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 border border-sky-500/30 space-y-4 bg-sky-500/5">
                <div className="flex items-center gap-2 text-sky-400">
                  <Send className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Message Administrator for Early Approval
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Want to organize an urgent community initiative before the 7 days expire? Send a message to the administrator requesting early authorization. If not approved early, your account automatically unlocks at the end of the 7 days.
                </p>
                <form onSubmit={handleSubmitAppeal} className="space-y-3">
                  <Textarea
                    placeholder="Briefly state why you need early approval and your plan for the upcoming event..."
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    className="min-h-[100px] text-xs glass border-foreground/15 rounded-xl resize-none"
                    disabled={isSubmittingAppeal}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {appealValidation.message}
                    </span>
                    <Button
                      type="submit"
                      disabled={!appealValidation.valid || isSubmittingAppeal}
                      className="rounded-full gap-2 text-xs h-9 px-5 shadow-xs cursor-pointer"
                    >
                      {isSubmittingAppeal ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Request Early Approval</span>
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="pt-2">
              <Button
                asChild
                className="rounded-full !bg-white !text-black hover:!bg-white/90 px-6 h-11 text-sm font-semibold shadow-md cursor-pointer select-none"
              >
                <Link href="/events">
                  Browse Community Events
                </Link>
              </Button>
            </div>
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
                    Your event creation privileges were restored by the administrator. Please be advised that cancelling {status.remainingStrikes === 1 ? "1 more event" : "2 more events"} before conclusion will result in a <strong>2-month suspension ban</strong> from organizing events.
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
