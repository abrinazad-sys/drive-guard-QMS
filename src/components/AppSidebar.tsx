import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  ScrollText,
  Activity,
  Bell,
  User,
  Settings,
  LogOut,
  FolderOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const adminNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Users", url: "/users", icon: Users },
  { title: "Permissions", url: "/permissions", icon: Shield },
  { title: "Audit Logs", url: "/audit", icon: ScrollText },
  { title: "Sync Health", url: "/sync", icon: Activity },
  // { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: User },
  { title: "System Settings", url: "/settings", icon: Settings },
];

const employeeNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Documents", url: "/documents", icon: FolderOpen },
  // { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const items = user?.role === "admin" ? adminNav : employeeNav;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div
          className={cn(
            "flex items-center justify-between px-4 h-16 border-b border-sidebar-border",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="flex items-center gap-2">
            {/* <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">Q</div> */}
            {!collapsed && (
              <div>
                <img
                  src="/images/bedata.png"
                  alt="BeData"
                  className="h-8 w-auto shrink-0 dark:invert"
                />
                {/* <div className="font-semibold tracking-tight">Drive Guard</div> */}
                {/* <div className="text-xs text-muted-foreground">Bedata QMS</div> */}
              </div>
            )}
          </div>
          <SidebarTrigger />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} className="text-muted-foreground">
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem> */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* ── User Footer ── */}
        <SidebarFooter className="p-4 pt-0 border-t border-transparent dark:border-[#1e2d3d] mt-2">
          {collapsed ? (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="icon"
                title={user?.name}
                className="h-10 w-10 rounded-full overflow-hidden p-0 border-gray-200 dark:border-gray-800 shrink-0"
              >
                <Avatar className="h-full w-full">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? "User")}&background=random`}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-2 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? "User")}&background=random`}
                      alt={user?.name ?? "User"}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Sign out"
                className="shrink-0 h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
