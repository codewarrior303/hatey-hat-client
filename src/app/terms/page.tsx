import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Star,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service & Organizer Guidelines | Hatey Hat",
  description:
    "Community rules, event cancellation policies, probation cooling-off terms, and organizer star rating guidelines for Hatey Hat Bangladesh.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 max-w-4xl space-y-10 animate-in fade-in-50">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors glass rounded-full px-4 py-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-foreground/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Hatey Hat Platform Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Terms of Service & Organizer Guidelines
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
          Community standards, reliability policies, event cancellation penalties,
          and trust rating metrics to protect volunteers and beneficiaries across Bangladesh.
        </p>
      </div>

      {/* Section 1: Core Terms */}
      <section className="glass rounded-[28px] p-6 sm:p-8 space-y-4 border border-foreground/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-foreground/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">1. Platform Community Agreement</h2>
            <p className="text-xs text-muted-foreground">General terms of participation for volunteers & organizers</p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed pt-2">
          <p>
            By registering an account or participating in initiatives on Hatey Hat, you agree to treat fellow volunteers, event organizers, and community beneficiaries with dignity, honesty, and respect. Hatey Hat is dedicated exclusively to grassroots social services—including disaster relief, environmental preservation, blood donation, medical camps, and education in Bangladesh.
          </p>
          <p>
            Users must provide truthful identity and contact information. Phone numbers entered during event creation must be active Bangladeshi numbers (`+8801...`) to facilitate volunteer coordination and on-ground safety.
          </p>
        </div>
      </section>

      {/* Section 2: Cancellation Policy & Penalties */}
      <section id="cancellation-policy" className="glass rounded-[28px] p-6 sm:p-8 space-y-6 border border-destructive/20 bg-destructive/[0.02]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              2. Event Cancellation Policy & Penalties
            </h2>
            <p className="text-xs text-muted-foreground">Protecting community volunteers against sudden event cancellations</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            When an organizer publishes an initiative, volunteers commit their time, resources, and travel across districts to join. Deleting an initiative at the last moment disrupts humanitarian relief and breaches community trust.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl glass p-4 border border-destructive/25 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                <XCircle className="h-4 w-4" />
                -0.5 ★ Rating Penalty
              </span>
              <p className="text-xs text-muted-foreground">
                Each early cancellation deducts <strong>-0.5 ★</strong> from the organizer&apos;s reliability score. Volunteers who joined receive an instant notification detailing the cancellation reason.
              </p>
            </div>

            <div className="rounded-2xl glass p-4 border border-amber-500/25 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                7-Day Cooling-Off Probation (3 Strikes)
              </span>
              <p className="text-xs text-muted-foreground">
                3 early cancellations trigger an automatic <strong>7-day cooling-off suspension</strong>. Event creation is frozen for 7 days. Organizers may submit an appeal to the administrator, or wait for the 7-day automatic unban timer.
              </p>
            </div>
          </div>

          <div className="rounded-2xl glass-strong p-4 border border-destructive/30 space-y-2 bg-destructive/10">
            <span className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              Repeated Violation During Probation: 2-Month Ban
            </span>
            <p className="text-xs text-foreground/90">
              If an account on probation cancels an event again (2 probation strikes), the system enforces a mandatory <strong>2-Month Suspension Ban</strong>. Event creation privileges are revoked for 60 days. An early appeal option unlocks after 1 month (30 days), and the system automatically restores privileges after 60 days.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: How Star Rating Works & How to Improve/Maintain */}
      <section id="rating-rules" className="glass rounded-[28px] p-6 sm:p-8 space-y-6 border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              3. Organizer Star Rating Algorithm & Trust Score
            </h2>
            <p className="text-xs text-muted-foreground">Transparent trust metrics calculated automatically from your events</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            The Hatey Hat Trust Rating measures an organizer&apos;s commitment to completing published social drives on schedule.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl glass p-4 border border-foreground/10 space-y-1.5 text-center">
              <span className="text-2xl font-black text-amber-400">5.0 ★</span>
              <p className="text-xs font-semibold text-foreground">Starting Base Score</p>
              <p className="text-[11px] text-muted-foreground">Every new community organizer starts with maximum 5.0 ★ trust rating.</p>
            </div>

            <div className="rounded-2xl glass p-4 border border-foreground/10 space-y-1.5 text-center">
              <span className="text-2xl font-black text-emerald-400">+0.5 ★</span>
              <p className="text-xs font-semibold text-foreground">Concluded Event Boost</p>
              <p className="text-[11px] text-muted-foreground">Successfully concluding an initiative on time awards +0.5 ★ rating points.</p>
            </div>

            <div className="rounded-2xl glass p-4 border border-foreground/10 space-y-1.5 text-center">
              <span className="text-2xl font-black text-destructive">-0.5 ★</span>
              <p className="text-xs font-semibold text-foreground">Cancellation Penalty</p>
              <p className="text-[11px] text-muted-foreground">Early cancellation deducts -0.5 ★ (rating never drops below 0.0 ★).</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              How to Recover & Improve Your Star Rating:
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Probation Recovery (3 Events):</strong> After 7-day probation reinstatement, organizers start at <strong>3.5 ★ base</strong>. Completing 3 consecutive events on time without cancellation awards +0.5 ★ each, clearing probation and returning your rating to full <strong>5.0 ★</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>2-Month Ban Recovery:</strong> Organizers returning after a 2-month suspension start at <strong>2.5 ★</strong> (or 2.0 ★ base). Concluding each future initiative on schedule adds <strong>+0.3 ★</strong> boost per event until full trust is rebuilt.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tips to Maintain 5.0 ★:</strong> Only schedule events with confirmed venues and realistic timings. Provide clear contact information so volunteers can easily communicate and attend.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-foreground/10 text-xs text-muted-foreground">
        <span>Questions about platform policy? Read our <Link href="/privacy" className="font-semibold text-foreground hover:underline">Privacy Policy</Link>.</span>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/events/create">Start an Initiative</Link>
        </Button>
      </div>
    </div>
  );
}
