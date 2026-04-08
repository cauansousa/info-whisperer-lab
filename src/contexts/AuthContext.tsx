import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { authSupabase } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { MeResponse, Role } from "@/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  me: MeResponse | null;
  loading: boolean;
  noTenant: boolean; // authenticated but 403 from /auth/me
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (minRole: Role) => boolean;
}

const hierarchy: Record<Role, number> = { member: 0, manager: 1, admin: 2, owner: 3 };

const fallbackAuthContext: AuthContextValue = {
  session: null,
  me: null,
  loading: true,
  noTenant: false,
  refresh: async () => {},
  logout: async () => {},
  hasRole: () => false,
};

const AuthContext = createContext<AuthContextValue | null>(fallbackAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null, me: null, loading: true, noTenant: false,
  });

  const fetchMe = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({ session: null, me: null, loading: false, noTenant: false });
      return;
    }
    try {
      const me = await api.getMe();
      setState({ session, me, loading: false, noTenant: false });
    } catch (err: any) {
      if (err?.status === 403 || err?.response?.status === 403) {
        setState({ session, me: null, loading: false, noTenant: true });
      } else {
        setState({ session, me: null, loading: false, noTenant: false });
      }
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = authSupabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchMe(session);
      }
    );
    authSupabase.auth.getSession().then(({ data: { session } }) => {
      fetchMe(session);
    });
    return () => subscription.unsubscribe();
  }, [fetchMe]);

  const refresh = useCallback(async () => {
    const { data: { session } } = await authSupabase.auth.getSession();
    await fetchMe(session);
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await authSupabase.auth.signOut();
    window.location.href = "/";
  }, []);

  const hasRole = useCallback((minRole: Role) => {
    if (!state.me) return false;
    return hierarchy[state.me.profile.role] >= hierarchy[minRole];
  }, [state.me]);

  return (
    <AuthContext.Provider value={{ ...state, refresh, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuthContext;
}
