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
  CheckCircle2,
  Clock,
  X,
  Building2,
  Phone,
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
import { getHighResImageUrl, capitalizeFirst, formatPhoneNumberInput } from "@/lib/utils";

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
    .min(1, "Thumbnail is required")
    .refine(
      (val) =>
        (/^https?:\/\//i.test(val) || /^\/api\/upload\/image\/[a-f0-9]{24}$/i.test(val)) &&
        !/^(javascript|data|vbscript):/i.test(val),
      "Must be a valid URL starting with http://, https://, or an uploaded image"
    ),
  location: z
    .string({ error: "Location is required" })
    .trim()
    .min(3, "Location must be at least 3 characters long")
    .max(160, "Location cannot exceed 160 characters"),
  organization: z
    .string()
    .trim()
    .max(120, "Organization name cannot exceed 120 characters")
    .optional(),
  creatorPhone: z
    .string({ error: "Contact phone number is required" })
    .trim()
    .refine(
      (val) => {
        const clean = val.replace(/[\s-]/g, "");
        return /^\+8801[3-9]\d{8}$/.test(clean);
      },
      "Must be a valid 10-digit Bangladesh phone number"
    ),
  eventDate: futureDateSchema,
});

export type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  initialData?: EventItem;
  isEditing?: boolean;
}

/**
 * Client-side canvas image compression to keep upload payloads lightweight & fast
 */
function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(event.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(format, quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

const DRAFT_STORAGE_KEY = "hatey_hat_event_hold_draft";

export function EventForm({ initialData, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasImgError, setHasImgError] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = React.useState<string | null>(null);
  const [hasDraftOnHold, setHasDraftOnHold] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const isSubmittedRef = React.useRef(false);

  const defaultValues: Partial<EventFormData> = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    eventType: initialData?.eventType || "Donation",
    thumbnail: initialData?.thumbnail || "",
    location: initialData?.location || "",
    organization: initialData?.organization || "",
    creatorPhone: initialData?.creatorPhone
      ? formatPhoneNumberInput(initialData.creatorPhone)
      : "+880 ",
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
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Restore draft on hold ONLY when first mounting the page if an unfinished draft exists
  React.useEffect(() => {
    if (isEditing) return;

    // If user just successfully created an event, guarantee 100% clean fresh form
    try {
      if (sessionStorage.getItem("hatey_hat_just_created_event")) {
        sessionStorage.removeItem("hatey_hat_just_created_event");
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasDraftOnHold(false);
        return;
      }
    } catch {
      // ignore
    }

    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasContent = Boolean(
          parsed.title?.trim() ||
          parsed.location?.trim() ||
          parsed.description?.trim() ||
          parsed.thumbnail?.trim()
        );
        if (hasContent) {
          if (parsed.title) setValue("title", parsed.title, { shouldValidate: true });
          if (parsed.organization) setValue("organization", parsed.organization, { shouldValidate: true });
          if (parsed.creatorPhone) setValue("creatorPhone", parsed.creatorPhone, { shouldValidate: true });
          if (parsed.eventType) setValue("eventType", parsed.eventType);
          if (parsed.location) setValue("location", parsed.location, { shouldValidate: true });
          if (parsed.description) setValue("description", parsed.description, { shouldValidate: true });
          if (parsed.eventDate) setValue("eventDate", parsed.eventDate, { shouldValidate: true });
          if (parsed.thumbnail) {
            setValue("thumbnail", parsed.thumbnail, { shouldValidate: true });
            if (parsed.uploadedFileName) {
              setUploadedFileName(parsed.uploadedFileName);
            }
          }
          // Only show banner when actually restoring prior progress
          setHasDraftOnHold(true);
        }
      }
    } catch {
      // ignore
    }
  }, [isEditing, setValue]);

  // Silently auto-save form inputs to draft on hold so progress is preserved if navigating away
  React.useEffect(() => {
    if (isEditing || isSubmittedRef.current) return;
    const subscription = watch((watched) => {
      const { title, description, eventType, location, eventDate, thumbnail, organization, creatorPhone } = watched;
      const hasContent = Boolean(
        title?.trim() ||
        description?.trim() ||
        location?.trim() ||
        organization?.trim() ||
        thumbnail?.trim() ||
        (creatorPhone && creatorPhone !== "+880")
      );
      if (hasContent) {
        try {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              title,
              description,
              eventType,
              location,
              organization,
              creatorPhone,
              eventDate,
              thumbnail,
              uploadedFileName,
            })
          );
        } catch {
          // ignore
        }
      } else {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, uploadedFileName, isEditing]);

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    reset({
      title: "",
      description: "",
      eventType: "Donation",
      thumbnail: "",
      location: "",
      organization: "",
      creatorPhone: "+880 ",
      eventDate: "",
    });
    setUploadedFileName(null);
    setLocalPreviewUrl(null);
    setHasDraftOnHold(false);
    toast.success("Draft discarded. Started fresh.");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberInput(e.target.value);
    setValue("creatorPhone", formatted, { shouldValidate: true, shouldDirty: true });
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (
      (e.key === "Backspace" && start <= 5 && end <= 5) ||
      (e.key === "Delete" && start < 5)
    ) {
      e.preventDefault();
    }
  };

  const previewThumbnail = watch("thumbnail");

  // Reset img error state when thumbnail changes
  React.useEffect(() => {
    setHasImgError(false);
  }, [previewThumbnail]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    // Instantly generate and display local object preview URL (0ms lag, always loads)
    const localUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localUrl);
    setUploadedFileName(file.name);
    setHasImgError(false);

    try {
      setIsUploadingImage(true);
      const loadingToast = toast.loading("Processing image from device...");

      const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);

      toast.loading("Uploading image to server...", { id: loadingToast });

      let uploadedUrl: string | undefined;

      // 1. Try Next.js direct upload endpoint first (always available, same-origin, works in all environments)
      try {
        const nextRes = await fetch("/api/upload/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: compressedBase64,
            contentType: file.type || "image/jpeg",
            name: file.name,
          }),
        });
        if (nextRes.ok) {
          const nextJson = await nextRes.json();
          uploadedUrl = nextJson.data?.url;
        }
      } catch {
        // Silent: fallback to backend upload router
      }

      // 2. Fallback to backend apiFetch if needed
      if (!uploadedUrl) {
        const res = await apiFetch<any>("/api/upload/image", {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            image: compressedBase64,
            contentType: file.type || "image/jpeg",
            name: file.name,
          }),
        });
        uploadedUrl = res.data?.url;
      }

      if (!uploadedUrl) {
        throw new Error("Could not retrieve image URL from server.");
      }

      // Ensure full URL for schema validation (starting with http:// or https://)
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const finalUrl = uploadedUrl.startsWith("http") ? uploadedUrl : `${origin}${uploadedUrl}`;

      // Store the server URL in the form state (for submission to database)
      setValue("thumbnail", finalUrl, { shouldValidate: true, shouldDirty: true });
      clearErrors("thumbnail");
      setHasImgError(false);
      toast.success("Image uploaded from device successfully!", { id: loadingToast });
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image from device.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Automatically upgrade image to 2K/4K high resolution before saving
      let finalThumb = getHighResImageUrl(data.thumbnail) || data.thumbnail;
      if (finalThumb.startsWith("/")) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        finalThumb = `${origin}${finalThumb}`;
      }

      // Convert local date string to full ISO Date & ensure capitalized first letters
      const payload = {
        ...data,
        title: capitalizeFirst(data.title),
        location: capitalizeFirst(data.location),
        organization: data.organization?.trim() ? capitalizeFirst(data.organization.trim()) : undefined,
        creatorPhone: data.creatorPhone.replace(/[\s-]/g, ""),
        description: capitalizeFirst(data.description),
        thumbnail: finalThumb,
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
        const res = await apiFetch<any>("/api/events", {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });
        // Mark as submitted to prevent auto-save from re-saving the completed event
        isSubmittedRef.current = true;
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          sessionStorage.setItem("hatey_hat_just_created_event", "true");
        } catch {
          // ignore
        }
        setHasDraftOnHold(false);
        reset({
          title: "",
          description: "",
          eventType: "Donation",
          thumbnail: "",
          location: "",
          organization: "",
          creatorPhone: "+880 ",
          eventDate: "",
        });
        toast.success("Event created successfully!");
        const target = res.data?.slug || res.data?._id;
        if (target) {
          router.push(`/events/${target}`);
        } else {
          router.push("/events");
        }
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
    const element = document.getElementById(firstKey);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {hasDraftOnHold && !isEditing && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl glass bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-xs font-semibold">Unfinished Event Draft on Hold</h5>
              <p className="text-[11px] text-muted-foreground">
                We restored your previous work so you can continue where you left off.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscardDraft}
            className="h-8 text-xs rounded-lg glass border-amber-500/30 hover:bg-amber-500/15 cursor-pointer shrink-0"
          >
            Discard Draft
          </Button>
        </div>
      )}

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
                placeholder="e.g., Emergency Flood Relief Initiative – Feni or Community Cleanup – Mirpur 10"
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

          {/* Organization / Host Group (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="organization">Organization Name (Optional)</Label>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </div>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="organization"
                placeholder="e.g., Youth Voice Foundation or leave empty to use your personal name"
                className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                {...register("organization")}
                aria-invalid={Boolean(errors.organization)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              If filled, your event will display this organization as organizer. If left empty, your account name will be used.
            </p>
            {errors.organization && (
              <p className="text-xs font-medium text-destructive">
                {errors.organization.message}
              </p>
            )}
          </div>

          {/* Contact Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="creatorPhone">Contact Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="creatorPhone"
                placeholder="+880 1 603 - 759 643"
                className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm font-mono tracking-wide"
                {...register("creatorPhone")}
                value={watch("creatorPhone") ?? "+880 "}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                maxLength={22}
                aria-invalid={Boolean(errors.creatorPhone)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pre-filled with +880. Enter your 10-digit mobile number. Displayed on the event details page for volunteers.
            </p>
            {errors.creatorPhone && (
              <p className="text-xs font-medium text-destructive">
                {errors.creatorPhone.message}
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
                  <SelectContent className="glass-menu border-border/40">
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
                placeholder="e.g., Mirpur 10, Dhaka or GEC Circle, Chattogram"
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

          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date & Time (Future Only)</Label>

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

          {/* Thumbnail Image URL & Device Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <span className="text-[11px] text-muted-foreground">
                Enter image URL or click icon to upload from device
              </span>
            </div>

            {/* Hidden file input opened by clicking the image icon or change button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploadingImage}
            />

            {uploadedFileName ? (
              /* User-Friendly Display: Shows file name and status, hides technical raw URL */
              <div className="flex items-center justify-between gap-3 px-3.5 h-11 rounded-xl glass bg-emerald-500/5 border border-emerald-500/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {uploadedFileName}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Uploaded from device &bull; Ready
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg glass hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFileName(null);
                      setLocalPreviewUrl(null);
                      setValue("thumbnail", "", { shouldValidate: true, shouldDirty: true });
                      clearErrors("thumbnail");
                    }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Remove uploaded image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Input Box with Clickable Picture Icon */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  title="Click to select and upload image from your device"
                  aria-label="Upload photo from device"
                  className="absolute left-2.5 top-2.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer group"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                  ) : (
                    <ImageIcon className="h-4 w-4 group-hover:scale-110 transition-transform text-foreground/75 hover:text-foreground" />
                  )}
                </button>

                <Input
                  id="thumbnail"
                  type="url"
                  placeholder="https://... or click icon on left to upload from device"
                  className="pl-11 pr-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                  {...register("thumbnail")}
                  aria-invalid={Boolean(errors.thumbnail)}
                />

                {previewThumbnail && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("thumbnail", "", { shouldValidate: true, shouldDirty: true });
                      clearErrors("thumbnail");
                      setHasImgError(false);
                      setLocalPreviewUrl(null);
                    }}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-foreground/10"
                    aria-label="Clear thumbnail URL"
                    title="Clear thumbnail URL"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

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
              {(localPreviewUrl || (previewThumbnail && !hasImgError)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={localPreviewUrl || previewThumbnail}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover transition-opacity duration-300"
                  onError={() => {
                    if (!localPreviewUrl) setHasImgError(true);
                  }}
                  loading="lazy"
                />
              ) : hasImgError ? (
                <div className="flex flex-col items-center gap-2 text-destructive text-xs p-4 text-center">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                  <span className="font-semibold text-foreground">Could not load this image URL</span>
                  <span className="text-muted-foreground text-[11px] max-w-[220px]">
                    Make sure the URL is valid or click the image icon on the left to upload directly from your device.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs p-4 text-center">
                  <ImageIcon className="h-8 w-8 opacity-40" />
                  <span>Enter an image URL or click the picture icon to upload from your device.</span>
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
