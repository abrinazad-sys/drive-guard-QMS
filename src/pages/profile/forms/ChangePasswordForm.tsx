import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
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
import { changePasswordSchema, type ChangePasswordDto } from "@/dto/ChangePasswordDto";

import { useUpdatePassword, useChangePassword, getApiErrorMessage } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

export function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { logout } = useAuth();
  const { mutateAsync: updatePassword, isPending: isUpdating } = useUpdatePassword();
  const { mutateAsync: changePassword, isPending: isChanging } = useChangePassword();

  const isPending = isUpdating || isChanging;

  const form = useForm<ChangePasswordDto>({
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordDto) => {
    try {
      await updatePassword({
        currentPassword: data.oldPassword || "",
        newPassword: data.newPassword,
      });

      toast.success("Password changed", { description: "Logging out..." });
      form.reset();
      logout();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error) || "Failed to update password");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none">
        <CardContent className="px-10 flex flex-col items-center">
          {/* Top Icon & Header */}
          <div className="flex items-center justify-center gap-5 py-5">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="text-primary h-8 w-8" />
            </div>
            <h2 className="text-[26px] font-bold text-foreground">
              Change Password
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed text-justify pb-5">
            Your password must contain at least 8 characters, it must also include at least one upper case letter, one lower case letter, one number and one special character.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-5 w-5" />
                        </div>
                        <Input
                          type={showOldPassword ? "text" : "password"}
                          placeholder="Current Password"
                          className="pl-10 pr-10 h-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-5 w-5" />
                        </div>
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password"
                          className="pl-10 pr-10 h-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-5 w-5" />
                        </div>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          className="pl-10 pr-10 h-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={isPending || !form.formState.isDirty}
                  className="w-full h-10 rounded-3xl font-semibold text-base shadow-[0_8px_25px_rgba(0,0,0,0.12)] transition-all"
                >
                  {isPending ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
