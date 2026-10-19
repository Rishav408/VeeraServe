import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/apiClient";
import { toMenuItem } from "../utils/menuMapper";
import type { CategoryDto, MenuItemDto } from "../types/api";
import type { MenuItem } from "../types/domain";

export interface MenuFilters {
  category?: string;
  veg?: boolean;
  maxPrice?: number;
  search?: string;
}

export const menuKeys = {
  categories: ["menu", "categories"] as const,
  items: (filters: MenuFilters) => ["menu", "items", filters] as const,
  item: (id: string) => ["menu", "item", id] as const
};

function toQueryString(filters: MenuFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.veg !== undefined) params.set("veg", String(filters.veg));
  if (filters.maxPrice !== undefined) params.set("max_price", String(filters.maxPrice));
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useCategories() {
  return useQuery({
    queryKey: menuKeys.categories,
    queryFn: () => apiGet<CategoryDto[]>("/categories")
  });
}

export function useMenuItems(filters: MenuFilters = {}) {
  return useQuery({
    queryKey: menuKeys.items(filters),
    queryFn: async () => {
      const dtos = await apiGet<MenuItemDto[]>(`/menu${toQueryString(filters)}`);
      return dtos
        .map(toMenuItem)
        .filter((item): item is MenuItem => item !== null);
    }
  });
}

export function useMenuItem(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.item(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const dto = await apiGet<MenuItemDto>(`/menu/${id}`);
      return toMenuItem(dto);
    }
  });
}
