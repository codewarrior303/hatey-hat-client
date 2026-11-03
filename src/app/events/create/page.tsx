"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { EventForm } from "@/components/events/event-form";

export default function CreateEventPage() {
  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl space-y-8 animate-in fade-in-50">
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
            Start a relief drive, neighbourhood cleanup, tree plantation, or healthcare camp.
            Neighbours in Dhaka can view your event details and join as volunteers.
          </p>
        </div>

        <EventForm />
      </div>
    </PrivateRoute>
  );
}
