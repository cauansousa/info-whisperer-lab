"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Library,
  Users,
  Shield,
  FolderUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useProfile } from "@/hooks/use-profile";
import { hasMinRole } from "@/lib/utils/roles";
import type { Role } from "@/types/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: Role;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Chat", href: "/app", icon: MessageSquare },
  { label: "Organization", href: "/admin/organization", icon: Users, minRole: "admin" },
  { label: "Libraries", href: "/admin/libraries", icon: Library, minRole: "manager" },
  { label: "Agents", href: "/admin/agents", icon: UsersRound, minRole: "admin" },
  { label: "Groups", href: "/admin/groups", icon: UsersRound, minRole: "admin" },
  { label: "AI Config", href: "/admin/ai-config", icon: Settings, minRole: "owner" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { data: profile } = useProfile();

  const userRole = profile?.profile.role as Role | undefined;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.minRole) return true;
    if (!userRole) return false;
    return hasMinRole(userRole, item.minRole);
  });

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border/60 bg-muted/20 transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b border-border/60 px-4">
        {!sidebarCollapsed && (
          <Link href="/app" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Knowledge AI</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8", sidebarCollapsed ? "mx-auto" : "ml-auto")}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app" || pathname.startsWith("/app/chat")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
