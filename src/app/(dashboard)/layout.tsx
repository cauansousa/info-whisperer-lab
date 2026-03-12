import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const AUTH_API_URL = process.env.AUTH_API_URL || "http://localhost:8001";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there is no Supabase session, force login.
  if (!session) {
    redirect("/login");
  }

  // Ensure the user has completed onboarding (i.e., has a profile/tenant).
  // If the Auth API returns 403 "No profile found", send them to onboarding
  // instead of bouncing back to the login page.
  let meRes: Response | null = null;
  try {
    meRes = await fetch(`${AUTH_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
  } catch {
    // Auth API unreachable — fall through to login
  }

  if (meRes?.status === 403) {
    redirect("/onboarding");
  }

  if (!meRes || !meRes.ok) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
