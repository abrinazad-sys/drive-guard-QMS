import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, User, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema, type ProfileDto } from "@/dto/ProfileDto";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const { user, updateProfile } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileDto>({
    mode: "onChange",
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialName },
  });

  const currentName = form.watch("name") || "";
  const hasChanges = form.formState.isDirty || !!selectedFile;

  const initials =
    currentName
      .split(" ")
      .filter(Boolean)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const photoUrl = previewUrl || user?.profilePhotoUrl || null;

  const onSubmit = async (data: ProfileDto) => {
    if (!user) return;
    setIsPending(true);

    try {
      await updateProfile(data.name, selectedFile || undefined);
      toast.success("Profile updated successfully!");
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      form.reset({ name: data.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none">
        <CardContent className="px-10 flex flex-col items-center">
          {/* Top Icon */}
          <div className="flex items-center justify-center gap-5 py-5">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <User className="text-primary h-8 w-8" />
            </div>
            <h2 className="text-[26px] font-bold text-foreground">
              Profile Information
            </h2>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-2"
            >
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="h-24 w-24 rounded-full overflow-hidden shadow-xl border-4 border-background">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={user?.name ?? "Profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -right-2 -bottom-2 h-10 w-10 bg-background border border-border rounded-full flex items-center justify-center text-foreground shadow-lg hover:bg-accent transition-all"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-foreground">
                    Profile Picture
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <User className="h-5 w-5" />
                          </div>
                          <Input
                            className="pl-10 h-10"
                            placeholder="Your Full Name"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      type="email"
                      value={email}
                      disabled
                      className="pl-10 h-10 bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isPending || !hasChanges}
                    className="w-full h-10 rounded-3xl font-semibold text-base shadow-[0_8px_25px_rgba(0,0,0,0.12)] transition-all"
                  >
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
