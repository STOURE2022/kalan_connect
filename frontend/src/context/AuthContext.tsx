"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (data: Parameters<typeof auth.register>[0]) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoggedIn: boolean;
  isParent: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isEtudiant: boolean;
  isAdmin: boolean;
  hasSubscription: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!auth.isLoggedIn()) { setUser(null); setLoading(false); return; }
    try {
      const profile = await auth.getProfile();
      setUser(profile);
    } catch {
      auth.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (phone: string, password: string): Promise<User> => {
    await auth.login(phone, password);
    const profile = await auth.getProfile();
    setUser(profile);
    return profile;
  };

  const register = async (data: Parameters<typeof auth.register>[0]): Promise<User> => {
    const result = await auth.register(data);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isLoggedIn: !!user,
      isParent:   user?.role === "parent",
      isTeacher:  user?.role === "teacher",
      isStudent:  user?.role === "student",
      isEtudiant: user?.role === "etudiant",
      isAdmin:    user?.role === "admin",
      hasSubscription: user?.has_active_subscription ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
