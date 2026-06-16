import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { changePasswordSchema, type ChangePasswordDto } from "@/dto/ChangePasswordDto";
import { useChangePassword, getApiErrorMessage } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ChangePasswordModalProps {
  open: boolean;
  onPasswordChanged: () => void;
}

export function ChangePasswordModal({ open, onPasswordChanged }: ChangePasswordModalProps) {
  const { user, logout } = useAuth();
  const { mutateAsync: changePassword, isPending } = useChangePassword();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isForced = user?.passwordChangeRequired === true;

  const form = useForm<ChangePasswordDto>({
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordDto) => {
    try {
      await changePassword({ newPassword: data.newPassword });
      toast.success("Password changed", { description: "Your password has been updated. Logging out..." });
      form.reset();
      setTimeout(() => logout(), 1500);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error) || "Failed to update password");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && isForced) return;
    }}>
      <DialogContent
        className={cn(
          "sm:max-w-[500px] p-0 border-none bg-transparent shadow-none gap-0",
          isForced && "[&>button]:hidden"
        )}
        onPointerDownOutside={(e) => isForced && e.preventDefault()}
        onEscapeKeyDown={(e) => isForced && e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            {isForced ? "You must change your password before continuing." : "Update your account password."}
          </DialogDescription>
        </DialogHeader>

        <div className="w-full max-w-lg mx-auto">
          <div className="rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none bg-card px-10 py-8 flex flex-col items-center">
            <div className="flex items-center justify-center gap-5 py-5">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Lock className="text-primary h-8 w-8" />
              </div>
              <h2 className="text-[26px] font-bold text-foreground">Change Password</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed text-justify pb-5">
              Your password must contain at least 8 characters, it must also include at least one upper case letter, one lower case letter, one number and one special character.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
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

            {isForced && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground underline text-sm transition-colors font-medium focus:outline-none"
                >
                  Logout and change later
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
