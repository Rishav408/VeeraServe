import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/apiClient";
import type { HealthResponse } from "../types/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthResponse>("/health"),
    retry: false
  });
}
