import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

const SUPER_ADMIN_EMAIL = "cauanvinicius00@gmail.com";

export default function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return null;

  const email = session?.user?.email;
  if (!email || email !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
