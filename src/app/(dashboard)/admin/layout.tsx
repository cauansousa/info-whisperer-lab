"use client";

import { useProfile } from "@/hooks/use-profile";
import { hasMinRole } from "@/lib/utils/roles";
import type { Role } from "@/types/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    !profile ||
    !hasMinRole(profile.profile.role as Role, "manager")
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access this area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
