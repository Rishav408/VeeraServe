import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "../lib/apiClient";
import type { FeedbackCreate, FeedbackDto } from "../types/api";

export const feedbackKeys = {
  all: ["feedback"] as const
};

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackCreate) =>
      apiPost<FeedbackCreate, FeedbackDto>("/feedback", payload)
  });
}

export function useAdminFeedback() {
  return useQuery({
    queryKey: feedbackKeys.all,
    queryFn: () => apiGet<FeedbackDto[]>("/feedback")
  });
}

export function useAcknowledgeFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiPatch<Record<string, never>, FeedbackDto>(`/feedback/${id}/acknowledge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
    }
  });
}
