import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout() {
  const { me, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 items-center justify-between border-b border-border/40 bg-card/30 px-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="text-sm font-medium text-foreground">{me?.tenant.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                {me?.profile.email?.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">{me?.profile.email}</span>
              <Button variant="ghost" size="icon" onClick={logout} className="h-7 w-7">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
