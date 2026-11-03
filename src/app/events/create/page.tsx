"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "@/components/events/event-form";

export default function CreateEventPage() {
  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-4xl space-y-8 animate-in fade-in-50">
        <div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Upcoming Events</span>
          </Link>
        </div>

        <div className="space-y-2 pb-6 border-b border-border">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-accent" />
            Community Action
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Organize a New Social Event
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Start a relief drive, neighbourhood cleanup, tree plantation, or healthcare camp.
            Neighbours in Dhaka can view your event details and join as volunteers.
          </p>
        </div>

        <EventForm />
      </div>
    </PrivateRoute>
  );
}
