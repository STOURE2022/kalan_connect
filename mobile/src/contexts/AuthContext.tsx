import React, { createContext, useContext, useEffect, useState } from "react";
import { getTokens } from "@/api/client";
import { authAPI } from "@/api/services";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isParent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  hasSubscription: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: Parameters<typeof authAPI.register>[0]) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const tokens = await getTokens();
      if (tokens?.access) {
        const profile = await authAPI.getProfile();
        setUser(profile);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (phone: string, password: string) => {
    await authAPI.login(phone, password);
    const profile = await authAPI.getProfile();
    setUser(profile);
  };

  const register = async (data: Parameters<typeof authAPI.register>[0]) => {
    const result = await authAPI.register(data);
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        isParent: user?.role === "parent",
        isTeacher: user?.role === "teacher",
        isAdmin: user?.role === "admin",
        isStudent: user?.role === "student",
        hasSubscription: user?.has_active_subscription ?? false,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
