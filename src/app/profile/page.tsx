"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Mail, Image as ImageIcon, Loader2, Save } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, updateUser } from "@/lib/auth-client";
import { getFallbackAvatar } from "@/lib/utils";

const profileSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name cannot exceed 80 characters"),
  photoURL: z
    .string()
    .trim()
    .url("Must be a valid URL starting with http:// or https://")
    .refine(
      (val) => /^https?:\/\//i.test(val) && !/^(javascript|data|vbscript):/i.test(val),
      "Photo URL must start with http:// or https://"
    )
    .or(z.literal(""))
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [isUpdating, setIsUpdating] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      photoURL: user?.image || "",
    },
  });

  // Keep form in sync when session loads
  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        photoURL: user.image || "",
      });
    }
  }, [user, reset]);

  const previewPhoto = watch("photoURL");
  const previewName = watch("name");

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      const res = await updateUser({
        name: data.name.trim(),
        image: data.photoURL?.trim() || null,
      });

      if ((res as any)?.error) {
        toast.error((res as any).error.message || "Could not update profile");
        return;
      }

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred while updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-2xl space-y-8 animate-in fade-in-50">
        <div className="space-y-1.5 pb-6 border-b border-foreground/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Volunteer Identity
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Volunteer Profile
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Your name and avatar appear when you create community initiatives across Dhaka.
          </p>
        </div>

        {/* Profile Card in Liquid Glass */}
        <div className="rounded-[32px] glass p-6 sm:p-10 shadow-xs space-y-8">
          {/* Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-foreground/10">
            <Avatar className="h-20 w-20 border-2 border-foreground/20 shadow-xs">
              <AvatarImage
                src={previewPhoto || user?.image || undefined}
                alt={previewName || user?.name || "User"}
              />
              <AvatarFallback className="text-xl font-semibold">
                {getFallbackAvatar(previewName || user?.name || user?.email || "User")}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-foreground">
                {previewName || user?.name || "Community Member"}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
              </p>
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
              <Label htmlFor="photoURL">Avatar Image URL (Optional)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="photoURL"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  className="pl-10 h-11 rounded-xl glass bg-transparent border-foreground/15 text-sm"
                  {...register("photoURL")}
                  aria-invalid={Boolean(errors.photoURL)}
                />
              </div>
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
