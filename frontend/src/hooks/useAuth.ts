"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.isLoggedIn()) {
      auth
        .getProfile()
        .then(setUser)
        .catch(() => {
          auth.logout();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    await auth.login(phone, password);
    const profile = await auth.getProfile();
    setUser(profile);
    return profile;
  };

  const register = async (data: Parameters<typeof auth.register>[0]) => {
    const result = await auth.register(data);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    window.location.href = "/";
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isLoggedIn: !!user,
    isParent: user?.role === "parent",
    isTeacher: user?.role === "teacher",
    hasSubscription: user?.has_active_subscription ?? false,
  };
}
