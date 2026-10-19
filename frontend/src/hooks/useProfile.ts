import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { apiPatch } from "../lib/apiClient";
import type { UserDto, UserPreferences } from "../types/api";

export function useUpdatePreferences() {
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: (preferences: UserPreferences) =>
      apiPatch<UserPreferences, UserDto>("/auth/me/preferences", preferences),
    onSuccess: (user) => updateUser(user)
  });
}
