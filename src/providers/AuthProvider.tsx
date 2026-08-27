"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { apiUrl } from "@/lib/api";

type User = {
  id: string;
  email: string;
  username?: string;
  name?: string;
};

type AuthCtx = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  accessToken: string | null;
};

const Ctx = createContext<AuthCtx>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshAuth: async () => false,
  accessToken: null,
});

function decodeJwt(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refresh");
    localStorage.removeItem("vision_last_chat_id");
    setUser(null);
    setAccessTokenState(null);
    // don't clear guest chat — keep for migration prompt
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const refresh = localStorage.getItem("refreshToken") || localStorage.getItem("refresh") || "";
    if (!refresh) return false;
    try {
      const res = await fetch(apiUrl("/api/auth/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        logout();
        return false;
      }
      const data = await res.json();
      const newAccess = data.access;
      if (newAccess) {
        localStorage.setItem("accessToken", newAccess);
        setAccessTokenState(newAccess);
        const payload = decodeJwt(newAccess);
        if (payload) {
          const u: User = {
            id: String(payload.user_id || payload.sub || ""),
            email: payload.email || payload.username || "",
            username: payload.username || "",
          };
          // Try to fetch full profile
          try {
            const meRes = await fetch(apiUrl("/api/auth/me/"), {
              headers: { Authorization: `Bearer ${newAccess}` },
            });
            if (meRes.ok) {
              const me = await meRes.json();
              u.email = me.email || u.email;
              u.username = me.username || u.username;
              u.name = me.name || me.first_name || "";
            }
          } catch {}
          setUser(u);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [logout]);

  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    const payload = decodeJwt(token);
    if (!payload) return false;
    // check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      // try refresh
      return await refreshAuth();
    }
    // Try me endpoint for validation; fallback to payload if endpoint missing
    try {
      const res = await fetch(apiUrl("/api/auth/me/"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const me = await res.json();
        setUser({
          id: String(me.id || payload.user_id || ""),
          email: me.email || payload.email || "",
          username: me.username || "",
          name: me.name || me.first_name || "",
        });
        return true;
      }
      if (res.status === 401) {
        return await refreshAuth();
      }
      // If me endpoint not available but token not expired, consider valid using payload
      if (payload.user_id || payload.sub) {
        setUser({
          id: String(payload.user_id || payload.sub),
          email: payload.email || payload.username || "",
          username: payload.username || "",
        });
        return true;
      }
      return false;
    } catch {
      // Network error but token looks valid
      if (payload.user_id || payload.sub) {
        setUser({
          id: String(payload.user_id || payload.sub),
          email: payload.email || "",
          username: payload.username || "",
        });
        return true;
      }
      return false;
    }
  }, [refreshAuth]);

  const login = useCallback((access: string, refresh: string) => {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setAccessTokenState(access);
    const payload = decodeJwt(access);
    if (payload) {
      setUser({
        id: String(payload.user_id || payload.sub || ""),
        email: payload.email || payload.username || "",
        username: payload.username || "",
      });
    }
    // Defer full validation
    validateToken(access);
  }, [validateToken]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
      if (!token) {
        setLoading(false);
        return;
      }
      setAccessTokenState(token);
      const ok = await validateToken(token);
      if (!ok) {
        // validateToken already attempted refresh
        const newToken = localStorage.getItem("accessToken") || "";
        if (!newToken || newToken === token) {
          setUser(null);
          setAccessTokenState(null);
        }
      }
      setLoading(false);
    };
    init();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "access") {
        const t = e.newValue;
        if (!t) { setUser(null); setAccessTokenState(null); }
        else { setAccessTokenState(t); validateToken(t); }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [validateToken]);

  const isAuthenticated = !!user && !!accessToken;

  return (
    <Ctx.Provider value={{ isAuthenticated, user, loading, login, logout, refreshAuth, accessToken }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
