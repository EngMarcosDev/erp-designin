import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
  Permission,
} from "@/types/erp";
import { resolveErpApiBase } from "@/lib/apiBase";

interface AuthUser {
  id?: number;
  name?: string;
  email: string;
  role: "ADMIN" | "USUARIO";
  isAdmin: boolean;
  active: boolean;
  permissions: Permission[];
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const apiBase = resolveErpApiBase(import.meta.env.VITE_API_URL);
const ERP_PERMISSION_VALUES: Permission[] = [
  "gerenciar_produtos",
  "gerenciar_pedidos",
  "gerenciar_estoque",
  "gerenciar_usuarios",
  "ver_relatorios",
];

const normalizeRole = (role?: string): "ADMIN" | "USUARIO" =>
  String(role || "").trim().toUpperCase() === "ADMIN" ? "ADMIN" : "USUARIO";

const normalizePermissions = (rawPermissions: unknown, role: "ADMIN" | "USUARIO"): Permission[] => {
  if (!Array.isArray(rawPermissions)) {
    return role === "ADMIN" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
  }

  const allowed = new Set<Permission>(ERP_PERMISSION_VALUES);
  const normalized = Array.from(
    new Set(
      rawPermissions
        .map((value) => String(value).trim().toLowerCase())
        .filter((value): value is Permission => allowed.has(value as Permission))
    )
  );

  if (normalized.length > 0) return normalized;
  return role === "ADMIN" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
};

const hydrateUserFromStorage = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem("erp_user");
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<AuthUser>;
    if (!parsed?.token || !parsed?.email) return null;

    const role = normalizeRole(parsed.role);
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role,
      isAdmin: role === "ADMIN",
      active: parsed.active !== false,
      permissions: normalizePermissions(parsed.permissions, role),
      token: parsed.token,
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const response = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const backendMessage = data?.error || data?.message;

      if (response.status === 429) {
        throw new Error("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.");
      }

      if (response.status >= 500) {
        throw new Error("Servidor indisponivel no momento. Tente novamente.");
      }

      throw new Error(backendMessage || "Credenciais invalidas");
    }

    const data = await response.json();
    const userData = data.user ?? data;
    const token: string = data.token;

    if (!token) {
      throw new Error("Resposta invalida do servidor");
    }

    const role = normalizeRole(userData.role);
    const active = userData.active !== false;
    if (!active) {
      throw new Error("Conta sem acesso ao sistema.");
    }

    const nextUser: AuthUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role,
      isAdmin: role === "ADMIN",
      active,
      permissions: normalizePermissions(userData.permissions, role),
      token,
    };

    try {
      window.localStorage.setItem("erp_user", JSON.stringify(nextUser));
    } catch {
      // Ignore storage errors
    }

    setUser(nextUser);
  };

  const logout = () => {
    try {
      window.localStorage.removeItem("erp_user");
    } catch {
      // Ignore storage errors
    }
    setUser(null);
  };

  const hasPermission = (permission: Permission) => {
    if (!user || !user.active) return false;
    if (user.isAdmin) return true;
    return user.permissions.includes(permission);
  };

  useEffect(() => {
    try {
      // Segurança: sempre exigir novo login ao recarregar/trocar sistema.
      window.localStorage.removeItem("erp_user");
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
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
