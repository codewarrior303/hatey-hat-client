"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  CalendarDays,
  MapPin,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Search,
  Mail,
  ShieldCheck,
  Share2,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

import { PrivateRoute } from "@/components/auth/private-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  generateEventParticipantsPDF,
  type ParticipantItem,
  type EventRosterMeta,
} from "@/lib/pdf-generator";

interface ParticipantsApiResponse {
  event: EventRosterMeta;
  count: number;
  participants: ParticipantItem[];
}

export default function EventParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [data, setData] = React.useState<ParticipantsApiResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const fetchParticipants = React.useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<ParticipantsApiResponse>(
        `/api/events/${eventId}/participants`,
        { auth: true, skipCache: true }
      );
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load event participants");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Organizer roster link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    try {
      setIsGeneratingPdf(true);
      generateEventParticipantsPDF(data.event, data.participants);
      toast.success("A4 Volunteer Roster PDF downloaded successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredParticipants = React.useMemo(() => {
    if (!data?.participants) return [];
    if (!searchQuery.trim()) return data.participants;
    const q = searchQuery.toLowerCase().trim();
    return data.participants.filter(
      (p) =>
        p.userName.toLowerCase().includes(q) ||
        p.userEmail.toLowerCase().includes(q)
    );
  }, [data?.participants, searchQuery]);

  return (
    <PrivateRoute>
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 pt-24 sm:pt-28 pb-12 space-y-8 animate-in fade-in-50">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Event Details</span>
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-foreground/10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Organizer Verified Roster</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Registered Volunteers & Participants
              </h1>

              {data?.event && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground pt-1">
                  <span className="font-medium text-foreground">
                    {data.event.title}
                  </span>
                  <span>•</span>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {data.event.eventType}
                  </Badge>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-foreground/70" />
                    {data.event.location}
                  </span>
                </div>
              )}
            </div>

            {/* Actions: Download PDF & Copy Link */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="gap-2 rounded-full h-11 px-5 glass"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Roster Link</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={isLoading || !data || data.participants.length === 0 || isGeneratingPdf}
                className="gap-2 rounded-full h-11 px-6 font-medium shadow-sm bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                <Download className="h-4 w-4" />
                <span>Download A4 PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-[20px]" />
              <Skeleton className="h-24 rounded-[20px]" />
              <Skeleton className="h-24 rounded-[20px]" />
            </div>
            <Skeleton className="h-72 rounded-[24px]" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchParticipants} />
        ) : !data ? (
          <EmptyState
            icon={Users}
            title="Event Not Found"
            description="Could not locate the participants list for this event."
            actionHref="/events/manage"
            actionLabel="Return to My Events"
          />
        ) : (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass p-5 rounded-[22px] space-y-1">
                <div className="flex items-center gap-2 text-foreground/80 mb-1">
                  <Users className="h-4 w-4 text-foreground/70" />
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Total Volunteers
                  </p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {data.participants.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined with verified accounts
                </p>
              </div>

              <div className="glass p-5 rounded-[22px] space-y-1">
                <div className="flex items-center gap-2 text-foreground/80 mb-1">
                  <CalendarDays className="h-4 w-4 text-foreground/70" />
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Scheduled Date
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-foreground">
                  {formatDate(data.event.eventDate)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Venue: {data.event.location}
                </p>
              </div>

              <div className="glass p-5 rounded-[22px] space-y-1">
                <div className="flex items-center gap-2 text-foreground/80 mb-1">
                  <FileText className="h-4 w-4 text-foreground/70" />
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Official Roster
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-foreground">
                  Ready for A4 Export
                </p>
                <p className="text-xs text-muted-foreground">
                  Official watermark & clean layout
                </p>
              </div>
            </div>

            {/* Search Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by volunteer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-full glass border-foreground/15 text-sm"
                />
              </div>

              <div className="text-xs text-muted-foreground text-right sm:text-left self-center">
                Showing{" "}
                <strong className="text-foreground font-semibold">
                  {filteredParticipants.length}
                </strong>{" "}
                of {data.participants.length} volunteers
              </div>
            </div>

            {/* Volunteers Table Card */}
            {data.participants.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Volunteers Registered Yet"
                description="When community members click 'Join Event', their name and email will be recorded here automatically."
                actionHref={`/events/${eventId}`}
                actionLabel="View Public Event Page"
              />
            ) : filteredParticipants.length === 0 ? (
              <div className="glass rounded-[24px] p-12 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">
                  No matching volunteers found
                </h3>
                <p className="text-sm text-muted-foreground">
                  No registered volunteer matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="rounded-full mt-2"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="glass rounded-[24px] overflow-hidden border border-foreground/10 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-foreground/10 bg-foreground/[0.02]">
                        <th className="py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-12 text-center">
                          #
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                          Volunteer Name
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                          Email Address
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                          Joined At
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      {filteredParticipants.map((participant, index) => {
                        const initials = (participant.userName || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <tr
                            key={participant._id}
                            className="hover:bg-foreground/[0.02] transition-colors"
                          >
                            <td className="py-3.5 px-4 text-xs text-muted-foreground text-center font-mono">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-foreground">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                                  {initials}
                                </div>
                                <span className="font-semibold text-[15px]">
                                  {participant.userName || "Anonymous Volunteer"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              <a
                                href={`mailto:${participant.userEmail}`}
                                className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5 opacity-60" />
                                <span>{participant.userEmail}</span>
                              </a>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 opacity-60" />
                                <span>
                                  {new Date(participant.joinedAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="h-3 w-3" />
                                <span>Confirmed</span>
                              </span>
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
        )}
      </div>
    </PrivateRoute>
  );
}
