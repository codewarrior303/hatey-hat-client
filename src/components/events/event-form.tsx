"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  MapPin,
  Image as ImageIcon,
  Type,
  Tag,
  Loader2,
  ArrowRight,
  Eye,
  AlertCircle,
  Sparkles,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { apiFetch, EVENT_TYPES, type EventItem } from "@/lib/api";

const futureDateSchema = z.string().refine((val) => {
  if (!val) return false;
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
    .refine(
      (val) => /^https?:\/\//i.test(val) && !/^(javascript|data|vbscript):/i.test(val),
      "URL must start with http:// or https://"
    ),
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

// Verified high quality community initiative photo presets
const PHOTO_PRESETS = [
  {
    label: "Winter Relief",
    url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Blanket Drive",
    url: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Cleanup Drive",
    url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Tree Plantation",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Community Meals",
    url: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=800&q=80",
  },
];

export function EventForm({ initialData, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasImgError, setHasImgError] = React.useState(false);

  const defaultValues: Partial<EventFormData> = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    eventType: initialData?.eventType || "Donation",
    thumbnail: initialData?.thumbnail || "",
    location: initialData?.location || "",
    eventDate: initialData?.eventDate
      ? new Date(initialData.eventDate).toISOString()
      : "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const previewThumbnail = watch("thumbnail");

  // Reset img error state when thumbnail changes
  React.useEffect(() => {
    setHasImgError(false);
  }, [previewThumbnail]);

  // Quick Date/Time helper
  const setQuickDate = (daysAhead: number, hour: number, minute: number = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(hour, minute, 0, 0);
    const dateStr = target.toISOString();
    setValue("eventDate", dateStr, { shouldValidate: true, shouldDirty: true });
    clearErrors("eventDate");
    toast.success(`Date set to ${target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${target.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
  };

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

  const onInvalid = (fieldErrors: any) => {
    const firstKey = Object.keys(fieldErrors)[0];
    const message = fieldErrors[firstKey]?.message || "Please complete all required fields";
    toast.error(message);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Event Title</Label>
            <div className="relative">
              <Type className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                placeholder="e.g., Winter Clothes Distribution – Mirpur 10"
                className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
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

          {/* Event Category */}
          <div className="space-y-1.5">
            <Label htmlFor="eventType">Event Category</Label>
            <Controller
              name="eventType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="eventType"
                    className="w-full h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                    aria-invalid={Boolean(errors.eventType)}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select an event category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="glass border-border/60">
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

          {/* Location & Landmark */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location & Landmark</Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="e.g., Mirpur 10 Circle, Dhaka"
                className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
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

          {/* Date & Time with Quick-Set Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="eventDate">Event Date & Time (Future Only)</Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Quick set:</span>
              </span>
            </div>

            {/* Quick date chips */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => setQuickDate(1, 10, 0)}
                className="text-xs px-3 py-1 rounded-full glass border border-foreground/10 hover:bg-foreground/10 text-foreground transition-all"
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(3, 15, 0)}
                className="text-xs px-3 py-1 rounded-full glass border border-foreground/10 hover:bg-foreground/10 text-foreground transition-all"
              >
                In 3 Days 3 PM
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7, 9, 30)}
                className="text-xs px-3 py-1 rounded-full glass border border-foreground/10 hover:bg-foreground/10 text-foreground transition-all"
              >
                Next Week 9:30 AM
              </button>
            </div>

            <Controller
              control={control}
              name="eventDate"
              render={({ field }) => (
                <DateTimePicker
                  id="eventDate"
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    if (val) clearErrors("eventDate");
                  }}
                  aria-invalid={Boolean(errors.eventDate)}
                />
              )}
            />
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

          {/* Thumbnail Image URL & One-Click Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="thumbnail">Thumbnail Image URL</Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Verified presets:</span>
              </span>
            </div>

            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                {...register("thumbnail")}
                aria-invalid={Boolean(errors.thumbnail)}
              />
            </div>

            {/* Suggested one-click preset photo pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {PHOTO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setValue("thumbnail", preset.url, { shouldValidate: true, shouldDirty: true });
                    clearErrors("thumbnail");
                    setHasImgError(false);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full glass border border-foreground/10 hover:bg-foreground/10 text-foreground transition-all"
                >
                  {preset.label}
                </button>
              ))}
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
                className="rounded-2xl glass bg-transparent border-foreground/15 text-sm p-4"
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
          <div className="rounded-[24px] glass p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="h-4 w-4 text-foreground/70" />
              <span>Image Preview</span>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
              {previewThumbnail && !hasImgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewThumbnail}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover transition-opacity duration-300"
                  onError={() => setHasImgError(true)}
                  loading="lazy"
                />
              ) : hasImgError ? (
                <div className="flex flex-col items-center gap-2 text-destructive text-xs p-4 text-center">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                  <span className="font-semibold text-foreground">Could not load this image URL</span>
                  <span className="text-muted-foreground text-[11px] max-w-[220px]">
                    Make sure the URL links directly to an image (.jpg, .png, .webp) or click one of the verified presets on the left.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs p-4 text-center">
                  <ImageIcon className="h-8 w-8 opacity-40" />
                  <span>Enter an image URL or click a preset on the left to see the live thumbnail.</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] glass p-5 space-y-3 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground text-sm">Community Guidelines</h4>
            <ul className="space-y-2 list-disc list-inside leading-relaxed">
              <li>Ensure the event location is safe and publicly accessible.</li>
              <li>Provide honest counts of beneficiaries and volunteers needed.</li>
              <li>Organizers are responsible for coordinating on-site relief activity.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-6 glass"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full px-7 font-medium gap-2 shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isEditing ? "Updating..." : "Creating Event..."}</span>
            </>
          ) : (
            <>
              <span>{isEditing ? "Update Event" : "Create Event"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
