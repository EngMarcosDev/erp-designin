import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE, joinUrl } from "@/api/client";

interface AuthUser {
  email: string;
  name?: string;
  isAdmin: boolean;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; needsRegister?: boolean; email?: string; name?: string; error?: string }>;
  register: (payload: { name: string; phone?: string; email: string; password: string }) => Promise<{ ok: boolean; verificationCode?: string; error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAdminEmails = () => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem("abacaxita_user");
      const parsed = saved ? (JSON.parse(saved) as AuthUser) : null;
      if (!parsed?.email) return null;
      if (!parsed?.token) return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const adminEmails = useMemo(() => getAdminEmails(), []);

  const decodeJwtPayload = (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      );
      return JSON.parse(json) as { email?: string; name?: string };
    } catch {
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, password }),
      });

      if (!response.ok) {
        setUser(null);
        return false;
      }

      const data = await response.json().catch(() => null);
      if (data?.user?.email) {
        setUser({
          email: data.user.email,
          name: data.user.name,
          isAdmin: data.user.role?.toLowerCase() === "admin",
          token: data.token,
        });
        return true;
      }

      if (data?.email) {
        setUser({
          email: data.email,
          isAdmin: data.role?.toLowerCase() === "admin",
          token: data.token,
        });
        return true;
      }
    } catch {
      // ignore
    }
    setUser(null);
    return false;
  };

  const register = async (payload: { name: string; phone?: string; email: string; password: string }) => {
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        return { ok: false, error: error?.error || "Não foi possível criar a conta." };
      }

      const data = await response.json().catch(() => null);
      return { ok: true, verificationCode: data?.verificationCode };
    } catch {
      return { ok: false, error: "Erro de conexão." };
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    const claims = decodeJwtPayload(idToken);
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok) {
        const userData = data?.user ?? data;
        if (userData?.email) {
          setUser({
            email: userData.email,
            name: userData.name ?? claims?.name,
            isAdmin: String(userData.role || "").toLowerCase() === "admin" || adminEmails.has(String(userData.email).toLowerCase()),
            token: data?.token || idToken,
          });
          return { ok: true };
        }
      }

      const needsRegister = Boolean(data?.needsRegistration) || response.status === 404 || response.status === 422;
      if (needsRegister) {
        return {
          ok: false,
          needsRegister: true,
          email: claims?.email,
          name: claims?.name,
          error: data?.message || "Seu e-mail Google ainda não está cadastrado.",
        };
      }

      return { ok: false, error: data?.message || "Não foi possível entrar com Google." };
    } catch {
      return { ok: false, error: "Erro de conexão no login com Google." };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  useEffect(() => {
    try {
      if (user) {
        window.localStorage.setItem("abacaxita_user", JSON.stringify(user));
      } else {
        window.localStorage.removeItem("abacaxita_user");
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
