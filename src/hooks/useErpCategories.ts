import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/api/erp";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types/erp";

export interface ResolvedErpCategory {
  id?: number;
  slug: string;
  name: string;
  isActive?: boolean;
  position?: number;
}

const slugToLabel = (slug: string) =>
  slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DEFAULT_CATEGORIES: ResolvedErpCategory[] = Object.entries(CATEGORY_LABELS).map(([slug, name]) => ({
  slug,
  name,
  isActive: true,
}));

export const resolveCategoryLabel = (
  slug: string,
  categoryMap?: Record<string, string>,
  fallbackName?: string | null
) => {
  const normalizedSlug = String(slug || "").trim();
  return categoryMap?.[normalizedSlug] || fallbackName || CATEGORY_LABELS[normalizedSlug] || slugToLabel(normalizedSlug) || normalizedSlug;
};

export const resolveCategoryColor = (slug: string) => CATEGORY_COLORS[String(slug || "").trim()] || "bg-muted";

export const useErpCategories = (includeInactive = true) => {
  const query = useQuery({
    queryKey: ["erp", "categories-dynamic", includeInactive],
    queryFn: () => fetchCategories(includeInactive),
    staleTime: 120000,
  });

  const categories = useMemo<ResolvedErpCategory[]>(() => {
    const fromApi = (query.data ?? [])
      .filter((entry) => entry.slug)
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        name: entry.name || resolveCategoryLabel(entry.slug),
        isActive: entry.isActive !== false,
        position: entry.position,
      }));

    if (fromApi.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    const seen = new Set<string>();
    return fromApi.filter((entry) => {
      const slug = String(entry.slug || "").trim();
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  }, [query.data]);

  const categoryMap = useMemo(
    () =>
      categories.reduce<Record<string, string>>((accumulator, category) => {
        accumulator[category.slug] = category.name;
        return accumulator;
      }, {}),
    [categories]
  );

  return {
    ...query,
    categories,
    categoryMap,
  };
};
