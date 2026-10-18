import { apiPostForm } from "../lib/apiClient";
import type { BotResponse } from "../types/domain";
import type { ChatResponse } from "../types/api";

export async function getBotResponse(
  input: string,
  audioBlob: Blob | null = null,
  imageFile: File | null = null
): Promise<BotResponse> {
  try {
    const formData = new FormData();
    if (input) formData.append("text", input);
    formData.append("session_id", "my_user_session");

    if (audioBlob) {
      formData.append("audio", audioBlob, "recording.webm");
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const data = await apiPostForm<ChatResponse>("/chat", formData);
    return { message: data.response, action: null };
  } catch {
    return { message: "Oops, something went wrong with the AI connection! Make sure the backend is running.", action: null };
  }
}
