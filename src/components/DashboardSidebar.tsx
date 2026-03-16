import { Brain, MessageSquare, Building2, BookOpen, Bot, Users2, Settings, UserPlus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Chat", url: "/app", icon: MessageSquare, minRole: "member" as const },
  { title: "My Libraries", url: "/app/libraries", icon: BookOpen, minRole: "member" as const },
  { title: "My Agents", url: "/app/agents", icon: Bot, minRole: "member" as const },
];

const adminItems = [
  { title: "Organization", url: "/admin/organization", icon: Building2, minRole: "admin" as const },
  { title: "Libraries", url: "/admin/libraries", icon: BookOpen, minRole: "manager" as const },
  { title: "Agents", url: "/admin/agents", icon: Bot, minRole: "admin" as const },
  { title: "Groups", url: "/admin/groups", icon: Users2, minRole: "admin" as const },
  { title: "AI Config", url: "/admin/ai-config", icon: Settings, minRole: "owner" as const },
];

const SUPER_ADMIN_EMAIL = "cauanvinicius00@gmail.com";

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasRole, session } = useAuth();
  const isSuperAdmin = session?.user?.email === SUPER_ADMIN_EMAIL;

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app" || location.pathname.startsWith("/app/chat");
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const visibleAdmin = adminItems.filter((item) => hasRole(item.minRole));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent">
            <Brain className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && <span className="font-display text-sm font-semibold">Knowledge AI</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/app"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Administration</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
