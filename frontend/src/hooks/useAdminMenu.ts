import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/apiClient";
import { menuKeys } from "./useMenu";
import type { CategoryCreate, CategoryDto, MenuItemCreate, MenuItemDto, MenuItemUpdate } from "../types/api";

export const adminMenuKeys = {
  items: ["menu", "admin-items"] as const
};

function invalidateMenu(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["menu"] });
}

export function useAdminMenuItems() {
  return useQuery({
    queryKey: adminMenuKeys.items,
    queryFn: () => apiGet<MenuItemDto[]>("/menu")
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: menuKeys.categories,
    queryFn: () => apiGet<CategoryDto[]>("/categories")
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MenuItemCreate) => apiPost<MenuItemCreate, MenuItemDto>("/menu", payload),
    onSuccess: () => invalidateMenu(queryClient)
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: MenuItemUpdate }) =>
      apiPatch<MenuItemUpdate, MenuItemDto>(`/menu/${id}`, changes),
    onSuccess: () => invalidateMenu(queryClient)
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/menu/${id}`),
    onSuccess: () => invalidateMenu(queryClient)
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryCreate) => apiPost<CategoryCreate, CategoryDto>("/categories", payload),
    onSuccess: () => invalidateMenu(queryClient)
  });
}
