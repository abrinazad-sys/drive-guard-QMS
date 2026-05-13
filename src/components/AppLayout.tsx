import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notifications as allNotifs } from "@/lib/mock-data";
import { ChangePasswordModal } from "@/pages/profile/forms/ChangePasswordModal";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { user, logout, mustReset, completeReset } = useAuth();
  const { mode, setMode, resolvedDark } = useTheme();
  const navigate = useNavigate();
  const notifs = user?.role === "admin" ? allNotifs.admin : allNotifs.user;
  const unread = notifs.filter((n) => !n.read).length;

  const initials =
    user?.name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <div
          className={cn(
            "flex w-full",
            mustReset && "blur-md pointer-events-none",
          )}
        >
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 flex items-center justify-between  px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur z-30">
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <div className="text-sm text-muted-foreground">
                    Welcome back
                  </div>
                  <div className="font-semibold">{user?.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Theme">
                      {resolvedDark ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Theme</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setMode("light")}>
                      <Sun className="h-4 w-4 mr-2" />
                      Light {mode === "light" && "✓"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMode("dark")}>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark {mode === "dark" && "✓"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMode("system")}>
                      <Monitor className="h-4 w-4 mr-2" />
                      System {mode === "system" && "✓"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate("/notifications")}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                      {unread}
                    </span>
                  )}
                </Button> */}
                <DropdownMenu>
                  {/* <DropdownMenuTrigger asChild> */}
                  {/* <button className="flex items-center gap-2 ml-1 rounded-full hover:bg-accent p-1 pr-3 transition"> */}
                  <Badge
                    variant="secondary"
                    className="text-[12px] p-3 h-4 capitalize"
                  >
                    {user?.role}
                  </Badge>
                  {/* <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium leading-none">{user?.name}</span>
                      <Badge variant="secondary" className="text-[10px] mt-0.5 h-4 capitalize">{user?.role}</Badge>
                    </span> */}
                  {/* </button> */}
                  {/* </DropdownMenuTrigger> */}
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      Profile
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        System Settings
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <ChangePasswordModal open={mustReset} onPasswordChanged={completeReset} />
    </SidebarProvider>
  );
}
