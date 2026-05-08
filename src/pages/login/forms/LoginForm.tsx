import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(4, "Min 4 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    mode: "onChange",
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success("Welcome back!", { position: "top-right" });
        onSuccess();
      } else {
        toast.error(result.error || "Login failed", { position: "top-right" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Email" 
                    {...field} 
                    className="h-12 bg-white border-[#D1D5DB] rounded-lg text-[13px] font-medium text-[#1A1A1A] placeholder:text-[#9CA3AF] placeholder:font-normal focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </FormControl>
                <FormMessage className="text-xs text-left px-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      {...field}
                      className="h-12 bg-white border-[#D1D5DB] rounded-lg text-[13px] font-medium text-[#1A1A1A] placeholder:text-[#9CA3AF] placeholder:font-normal focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all pr-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <FormMessage className="text-xs text-left px-1" />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end pt-1">
            <button type="button" className="text-[12px] font-semibold text-primary hover:underline">
              Forgot password ?
            </button>
          </div>

          <div className="flex items-center my-6 py-2">
            <div className="flex-1 border-t border-[#E5E7EB]"></div>
            <span className="px-3 text-[11px] font-medium text-[#9CA3AF]">or</span>
            <div className="flex-1 border-t border-[#E5E7EB]"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-white border-[#E5E7EB] text-[#374151] rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
          >
            Login with Google
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-white rounded-full text-[14px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Login"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
