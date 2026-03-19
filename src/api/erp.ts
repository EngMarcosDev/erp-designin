import { resolveErpApiBase } from "@/lib/apiBase";

export interface ErpProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  discountLabel?: string;
  discountActive?: boolean;
  category: string;
  active: boolean;
  stock: number;
  image: string;
  bannerImage?: string;
  showBannerPrice?: boolean;
  gallery?: string[];
  brand?: string;
  subcategory?: string;
  material?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
}

export interface ErpOrder {
  id: number;
  email: string;
  customerName?: string;
  items: any[];
  total: number;
  createdAt: string;
  status?: string;
}

export interface StockReportItem {
  id: number;
  name: string;
  stock: number;
  active: boolean;
}

export interface ErpUser {
  id: number;
  name: string;
  email: string;
  role: string;
  accessType?: "ERP" | "HEADSHOP";
  active?: boolean;
  permissions?: string[];
  avatar?: string;
}

export interface StockCompareItem {
  key: string;
  name: string;
  category: string;
  erp: { stock: number; price: number; active: boolean } | null;
  headshop: { stock: number; price: number; active: boolean } | null;
}

const apiBase = resolveErpApiBase(import.meta.env.VITE_API_URL);

const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("erp_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

const buildHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const sanitizePayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item)).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const sanitized = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (accumulator, [key, itemValue]) => {
        const normalized = sanitizePayload(itemValue);
        if (normalized !== undefined) {
          accumulator[key] = normalized;
        }
        return accumulator;
      },
      {}
    );

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  return value === undefined ? undefined : value;
};

const request = async (path: string, init?: RequestInit) => {
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        ...buildHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("Falha de conexão com o servidor. Verifique se o backend está online.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error || payload?.message || `Erro na API (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const fetchProducts = async (): Promise<ErpProduct[]> => {
  return request("/products");
};

export const createProduct = async (payload: Partial<ErpProduct>): Promise<ErpProduct> => {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(sanitizePayload(payload)),
  });
};

export const updateProduct = async (id: number, payload: Partial<ErpProduct>): Promise<ErpProduct> => {
  return request(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(sanitizePayload(payload)),
  });
};

export const deleteProduct = async (id: number) => {
  await request(`/products/${id}`, { method: "DELETE" });
  return true;
};

export const fetchOrders = async (): Promise<ErpOrder[]> => {
  return request("/orders");
};

export const updateOrderStatus = async (
  id: number,
  status: "pendente" | "pago" | "cancelado"
): Promise<ErpOrder> => {
  return request(`/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
};

export const fetchStockReport = async (): Promise<StockReportItem[]> => {
  return request("/reports/stock");
};

export const fetchUsers = async (): Promise<ErpUser[]> => {
  return request("/users");
};

export const createUser = async (payload: Partial<ErpUser> & { password: string }): Promise<ErpUser> => {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(sanitizePayload(payload)),
  });
};

export const updateUser = async (id: number, payload: Partial<ErpUser> & { password?: string }) => {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(sanitizePayload(payload)),
  });
};

export const deleteUser = async (id: number) => {
  await request(`/users/${id}`, { method: "DELETE" });
  return true;
};

export const fetchStockComparison = async (): Promise<StockCompareItem[]> => {
  return request("/sync/stock/compare");
};

export const syncStockPull = async () => {
  return request("/sync/stock/pull", {
    method: "POST",
  });
};

export const syncStockPush = async () => {
  return request("/sync/stock/push", {
    method: "POST",
  });
};
