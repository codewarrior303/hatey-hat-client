"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Mail, Image as ImageIcon, Loader2, Save, Trash2, X, Upload } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, updateUser } from "@/lib/auth-client";
import { getFallbackAvatar, compressImage, getHighResImageUrl } from "@/lib/utils";

const profileSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name cannot exceed 80 characters"),
  photoURL: z
    .string()
    .trim()
    .refine(
      (val) =>
        !val ||
        /^https?:\/\//i.test(val) ||
        /^\/api\/upload\/image\/[a-f0-9]{24}$/i.test(val),
      "Must be a valid URL starting with http://, https://, or an uploaded image",
    )
    .or(z.literal(""))
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      photoURL: getHighResImageUrl(user?.image) || "",
    },
  });

  // Keep form in sync when session loads
  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        photoURL: getHighResImageUrl(user.image) || "",
      });
    }
  }, [user, reset]);

  const previewPhoto = watch("photoURL");
  const previewName = watch("name");

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    try {
      setIsUploadingImage(true);
      const loadingToast = toast.loading("Compressing and uploading photo...");

      const compressedBase64 = await compressImage(file, 2560, 2560, 0.96);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: compressedBase64,
          contentType: file.type || "image/jpeg",
          name: file.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to upload image to server.");
      }

      const json = await res.json();
      const uploadedUrl = json.data?.url;
      if (!uploadedUrl) {
        throw new Error("Could not retrieve image URL from server.");
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const finalUrl = uploadedUrl.startsWith("http") ? uploadedUrl : `${origin}${uploadedUrl}`;

      setValue("photoURL", finalUrl, { shouldValidate: true, shouldDirty: true });
      clearErrors("photoURL");
      toast.success("Photo uploaded successfully! Click 'Save Changes' to update.", {
        id: loadingToast,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image from device.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      const finalImage = data.photoURL?.trim() ? getHighResImageUrl(data.photoURL.trim()) : null;
      const res = await updateUser({
        name: data.name.trim(),
        image: finalImage,
      });

      if ((res as any)?.error) {
        toast.error((res as any).error.message || "Could not update profile");
        return;
      }

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(
        err?.message || "An unexpected error occurred while updating profile",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-12 max-w-2xl space-y-8 animate-in fade-in-50">
        <div className="space-y-1.5 pb-6 border-b border-foreground/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Volunteer Identity
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Volunteer Profile
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Your name and avatar appear when you create community initiatives
            across Bangladesh.
          </p>
        </div>

        {/* Profile Card in Liquid Glass */}
        <div className="rounded-[32px] glass p-6 sm:p-10 shadow-xs space-y-8">
          {/* Avatar Preview & Quick Photo Actions */}
          <div className="space-y-4 pb-6 border-b border-foreground/10">
            {/* User Avatar + Full Name and Email without truncation */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left">
              <Avatar className="h-20 w-20 border-2 border-foreground/20 shadow-xs shrink-0">
                <AvatarImage
                  src={getHighResImageUrl(previewPhoto) || undefined}
                  alt={previewName || user?.name || "User"}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <AvatarFallback className="text-xl font-bold bg-foreground/10 text-foreground">
                  {getFallbackAvatar(
                    previewName || user?.name || user?.email || "User",
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-foreground break-words">
                  {previewName || user?.name || "Community Member"}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 break-all">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>{user?.email}</span>
                </p>
              </div>
            </div>

            {/* Photo Actions: Upload & Remove placed neatly along the break line */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                aria-hidden="true"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full h-9 px-4 text-xs font-semibold gap-1.5 glass border-foreground/20 hover:bg-foreground/10 cursor-pointer shadow-xs shrink-0"
                aria-label="Upload photo from device"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Upload Photo</span>
              </Button>

              {previewPhoto ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue("photoURL", "", { shouldDirty: true, shouldValidate: true });
                    toast("Profile picture removed. Click 'Save Changes' to update.", {
                      icon: "🗑️",
                    });
                  }}
                  className="rounded-full h-9 px-4 text-xs font-semibold gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer shadow-xs shrink-0"
                  aria-label="Remove photo and use initials avatar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Photo</span>
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground bg-foreground/5 px-3.5 py-1.5 rounded-full border border-foreground/10 flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold text-foreground">Initials Active</span>
                  <span>({getFallbackAvatar(previewName || user?.name || user?.email || "User")})</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Your full name"
                  className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
              </div>
              {errors.name && (
                <p className="text-xs font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email (Read-Only) */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address (Primary)</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-10 h-11 rounded-xl glass bg-foreground/5 border-foreground/10 text-muted-foreground cursor-not-allowed text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Authentication email cannot be changed directly.
              </p>
            </div>

            {/* Photo URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="photoURL">Avatar Image URL (Optional)</Label>
                <span className="text-xs text-muted-foreground font-normal">Optional</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute left-3 top-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-foreground/10 cursor-pointer"
                  aria-label="Upload photo from device"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </button>
                <Input
                  id="photoURL"
                  type="url"
                  placeholder="https://... or click icon to upload from device"
                  className="pl-10 pr-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                  {...register("photoURL")}
                  aria-invalid={Boolean(errors.photoURL)}
                />
                {previewPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("photoURL", "", { shouldDirty: true, shouldValidate: true });
                    }}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-foreground/10 cursor-pointer"
                    aria-label="Clear image URL"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste an image URL or click the photo icon on the left to upload from your device.
              </p>
              {errors.photoURL && (
                <p className="text-xs font-medium text-destructive">
                  {errors.photoURL.message}
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isUpdating || !isDirty}
                className="rounded-full h-11 px-7 font-medium gap-2 shadow-xs"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PrivateRoute>
  );
}
