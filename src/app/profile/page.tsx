"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Mail, Image as ImageIcon, Loader2, Save, ShieldCheck } from "lucide-react";

import { PrivateRoute } from "@/components/auth/private-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl space-y-8 animate-in fade-in-50">
        <div className="space-y-2 pb-6 border-b border-border">
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Volunteer Identity
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Volunteer Profile
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your display name and community avatar shown to organizers and fellow volunteers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Preview Card (1 col) */}
          <Card className="border-border bg-card p-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
              {previewPhoto ? (
                <AvatarImage src={previewPhoto} alt={previewName || "User"} />
              ) : user?.image ? (
                <AvatarImage src={user.image} alt={user.name || "User"} />
              ) : null}
              <AvatarFallback className="text-xl">
                {getFallbackAvatar(previewName || user?.name || user?.email || "HH")}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {previewName || user?.name || "Community Volunteer"}
              </h3>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <Badge variant="secondary" className="text-xs font-semibold">
              Active Contributor
            </Badge>
          </Card>

          {/* Edit Form Card (2 cols) */}
          <Card className="md:col-span-2 border-border shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Edit Personal Information</CardTitle>
              <CardDescription>
                Updates will be reflected immediately across Hatey Hat events and registrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="pl-9"
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

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email || ""}
                      readOnly
                      disabled
                      className="pl-9 bg-muted/60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email address is tied to your account and cannot be modified directly.
                  </p>
                </div>

                {/* Photo URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="photoURL">Avatar Image URL</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="photoURL"
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      className="pl-9"
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

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdating || !isDirty}
                    className="gap-2 font-semibold"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PrivateRoute>
  );
}
