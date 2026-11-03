"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  CalendarDays,
  MapPin,
  Image as ImageIcon,
  Type,
  Tag,
  Loader2,
  ArrowRight,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, EVENT_TYPES, type EventItem } from "@/lib/api";

const futureDateSchema = z.string().refine((val) => {
  const d = new Date(val);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}, {
  message: "Event date and time must be set in the future",
});

export const eventFormSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters long")
    .max(120, "Title cannot exceed 120 characters"),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(20, "Description must be at least 20 characters long")
    .max(3000, "Description cannot exceed 3000 characters"),
  eventType: z.enum(EVENT_TYPES, {
    error: "Please select an event category",
  }),
  thumbnail: z
    .string({ error: "Thumbnail URL is required" })
    .trim()
    .url("Must be a valid URL starting with http:// or https://")
    .refine((val) => /^https?:\/\//i.test(val), "URL must start with http:// or https://"),
  location: z
    .string({ error: "Location is required" })
    .trim()
    .min(3, "Location must be at least 3 characters long")
    .max(160, "Location cannot exceed 160 characters"),
  eventDate: futureDateSchema,
});

export type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  initialData?: EventItem;
  isEditing?: boolean;
}

/** Formats a Date object or ISO string to `YYYY-MM-DDTHH:mm` format for datetime-local input */
function toDateTimeLocalString(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function EventForm({ initialData, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Minimum allowed date-time is current minute
  const minDateTime = React.useMemo(() => {
    return toDateTimeLocalString(new Date());
  }, []);

  const defaultValues: Partial<EventFormData> = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    eventType: initialData?.eventType || "Donation",
    thumbnail: initialData?.thumbnail || "",
    location: initialData?.location || "",
    eventDate: initialData?.eventDate
      ? toDateTimeLocalString(initialData.eventDate)
      : "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const previewThumbnail = watch("thumbnail");

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Convert local date string to full ISO Date
      const payload = {
        ...data,
        eventDate: new Date(data.eventDate).toISOString(),
      };

      if (isEditing && initialData?._id) {
        await apiFetch(`/api/events/${initialData._id}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify(payload),
        });
        toast.success("Event updated successfully!");
        router.push("/events/manage");
        router.refresh();
      } else {
        await apiFetch("/api/events", {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });
        toast.success("Event created successfully! Redirecting to Upcoming Events...");
        router.push("/events");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save event. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Event Title</Label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                placeholder="e.g., Winter Clothes Distribution – Mirpur 10"
                className="pl-9"
                {...register("title")}
                aria-invalid={Boolean(errors.title)}
              />
            </div>
            {errors.title && (
              <p className="text-xs font-medium text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Event Category Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="eventType">Event Category</Label>
            <Controller
              control={control}
              name="eventType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="eventType" className="w-full">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <SelectValue placeholder="Select event category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.eventType && (
              <p className="text-xs font-medium text-destructive">
                {errors.eventType.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location & Landmark</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="e.g., Mirpur 10 Circle, Dhaka"
                className="pl-9"
                {...register("location")}
                aria-invalid={Boolean(errors.location)}
              />
            </div>
            {errors.location && (
              <p className="text-xs font-medium text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label htmlFor="eventDate">Event Date & Time (Future Only)</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="eventDate"
                type="datetime-local"
                min={minDateTime}
                className="pl-9"
                {...register("eventDate")}
                aria-invalid={Boolean(errors.eventDate)}
              />
            </div>
            {errors.eventDate ? (
              <p className="text-xs font-medium text-destructive">
                {errors.eventDate.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Events must take place in the future. Past dates are blocked.
              </p>
            )}
          </div>

          {/* Thumbnail Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="thumbnail">Thumbnail Image URL</Label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                className="pl-9"
                {...register("thumbnail")}
                aria-invalid={Boolean(errors.thumbnail)}
              />
            </div>
            {errors.thumbnail && (
              <p className="text-xs font-medium text-destructive">
                {errors.thumbnail.message}
              </p>
            )}
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Event Description & Volunteer Plan</Label>
            <div className="relative">
              <Textarea
                id="description"
                rows={6}
                placeholder="Explain the background, beneficiary group, meeting point, schedule, and volunteer requirements..."
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
              />
            </div>
            {errors.description && (
              <p className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Live Thumbnail Preview & Guidelines (1 col) */}
        <div className="space-y-5">
          <Card className="border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="h-4 w-4 text-primary" />
              <span>Image Preview</span>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
              {previewThumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewThumbnail}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs p-4 text-center">
                  <ImageIcon className="h-8 w-8 opacity-40" />
                  <span>Enter an image URL on the left to see the live card thumbnail.</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-border bg-muted/40 p-5 space-y-3 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground text-sm">Community Guidelines</h4>
            <ul className="space-y-2 list-disc list-inside leading-relaxed">
              <li>Ensure the event location is safe and publicly accessible.</li>
              <li>Provide honest counts of beneficiaries and volunteers needed.</li>
              <li>Organizers are responsible for coordinating on-site relief activity.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 font-bold px-8 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isEditing ? "Saving changes..." : "Publishing event..."}</span>
            </>
          ) : (
            <>
              <span>{isEditing ? "Save Event Changes" : "Create Community Event"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
