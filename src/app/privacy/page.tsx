import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Phone,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy | Hatey Hat",
  description:
    "How Hatey Hat protects volunteer personal data, organizer contact numbers, authentication security, and platform privacy across Bangladesh.",
};

export default function PrivacyPage() {
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
          <span>Data Privacy & Community Trust</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
          We believe in honest, transparent social welfare. Learn how your account data,
          contact numbers, and activity logs are kept secure on Hatey Hat.
        </p>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-[28px] p-6 sm:p-7 space-y-3 border border-foreground/10">
          <div className="h-10 w-10 rounded-2xl bg-foreground/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Account & Password Security</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All passwords are cryptographically salted and hashed using Argon2/bcrypt algorithms. Passwords are never stored in plaintext and cannot be read by anyone, including platform administrators.
          </p>
        </div>

        <div className="glass rounded-[28px] p-6 sm:p-7 space-y-3 border border-foreground/10">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Phone className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Organizer Contact Numbers</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Bangladeshi phone number (`+880...`) collected during event creation is used exclusively to allow registered volunteers to coordinate logistics, emergency relief, and on-site attendance. It is never sold or used for marketing.
          </p>
        </div>

        <div className="glass rounded-[28px] p-6 sm:p-7 space-y-3 border border-foreground/10">
          <div className="h-10 w-10 rounded-2xl bg-foreground/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Profile & Avatar Management</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Volunteers may upload custom profile pictures or use our initials-based avatar system. You can update or remove your photo at any time from your Volunteer Profile page with zero residue.
          </p>
        </div>

        <div className="glass rounded-[28px] p-6 sm:p-7 space-y-3 border border-foreground/10">
          <div className="h-10 w-10 rounded-2xl bg-foreground/10 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Audit Logs & Transparency</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Event creation, volunteer joining, and administrative actions are logged in tamper-evident security audit trails to protect against spam, fraudulent events, and unauthorized account access.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-foreground/10 text-xs text-muted-foreground">
        <span>To view organizer rules and cancellation penalties, visit our <Link href="/terms" className="font-semibold text-foreground hover:underline">Terms of Service</Link>.</span>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/events">Explore Initiatives</Link>
        </Button>
      </div>
    </div>
  );
}
