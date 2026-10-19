import { useMutation } from "@tanstack/react-query";
import { apiPost } from "../lib/apiClient";
import type { FeedbackCreate, FeedbackDto } from "../types/api";

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackCreate) =>
      apiPost<FeedbackCreate, FeedbackDto>("/feedback", payload)
  });
}
