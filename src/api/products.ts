import { apiGet, USE_MOCKS } from "./client";
import { mockApi } from "./mocks";
import type { ApiListResponse, Product } from "./types";

export async function fetchFeaturedProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.featuredProducts();
  const response = await apiGet<ApiListResponse<Product>>("/products/featured");
  return response.data;
}

export async function fetchPopularProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.popularProducts();
  const response = await apiGet<ApiListResponse<Product>>("/products/popular");
  return response.data;
}

export async function fetchProductsByCategory(slug: string): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.productsByCategory(slug);
  const response = await apiGet<ApiListResponse<Product>>(
    `/categories/${slug}/products`
  );
  return response.data;
}
