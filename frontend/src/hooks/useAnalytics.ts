import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/apiClient";
import type { DashboardAnalytics } from "../types/api";

export const analyticsKeys = {
  dashboard: ["analytics", "dashboard"] as const
};

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.dashboard,
    queryFn: () => apiGet<DashboardAnalytics>("/analytics/dashboard"),
    refetchInterval: 15000
  });
}
