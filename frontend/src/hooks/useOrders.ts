import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "../lib/apiClient";
import type { OrderCreate, OrderDto, OrderStatusUpdate } from "../types/api";

const ORDERS_KEY = "orders";

export const orderKeys = {
  all: [ORDERS_KEY] as const,
  list: [ORDERS_KEY, "list"] as const,
  detail: (id: number) => [ORDERS_KEY, "detail", id] as const
};

export function useOrders(options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: () => apiGet<OrderDto[]>("/orders"),
    refetchInterval: options.poll ? 5000 : false
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? 0),
    enabled: id !== undefined && Number.isFinite(id),
    queryFn: () => apiGet<OrderDto>(`/orders/${id}`),
    refetchInterval: (query) => {
      const order = query.state.data;
      return order && order.status !== "served" ? 4000 : false;
    }
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderCreate) => apiPost<OrderCreate, OrderDto>("/orders", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatusUpdate["status"] }) =>
      apiPatch<OrderStatusUpdate, OrderDto>(`/orders/${id}/status`, { status }),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}
