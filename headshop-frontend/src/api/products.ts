import { apiGet, apiGetWithBase, ERP_API_BASE } from "./client";
import type { ApiListResponse, Product } from "./types";

const unwrapList = <T,>(payload: ApiListResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      "/products/featured"
    );
    const list = unwrapList(response);
    if (list.length > 0) return list;
    const fallback = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      "/products"
    );
    const fallbackList = unwrapList(fallback);
    if (fallbackList.length > 0) return fallbackList;
  } catch {
    // ignore and try HeadShop fallback
  }
  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>(
      "/products/featured"
    );
    const list = unwrapList(response);
    if (list.length > 0) return list;
    const fallback = await apiGet<ApiListResponse<Product> | Product[]>("/products");
    return unwrapList(fallback);
  } catch {
    return [];
  }
}

export async function fetchPopularProducts(): Promise<Product[]> {
  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      "/products/popular"
    );
    const list = unwrapList(response).filter((item) => item.isActive !== false);
    return list;
  } catch {
    // ignore and try HeadShop fallback
  }
  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>(
      "/products/popular"
    );
    const list = unwrapList(response).filter((item) => item.isActive !== false);
    return list;
  } catch {
    return [];
  }
}

export async function fetchProductsByCategory(slug: string): Promise<Product[]> {
  const safeSlug = encodeURIComponent(slug);
  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      `/categories/${safeSlug}/products`
    );
    const list = unwrapList(response);
    if (list.length > 0) return list;
  } catch {
    // ignore and try HeadShop fallback
  }
  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>(
      `/categories/${safeSlug}/products`
    );
    return unwrapList(response);
  } catch {
    return [];
  }
}
