import { API_URL } from "../utils/config";
import { apiErrorFromResponse, authHeaders } from "./apiClient";
import type { ChatStreamEvent } from "../types/api";

export interface ChatRequest {
  text: string;
  sessionId: string;
  audio?: Blob | null;
  image?: File | null;
}

export function parseStreamEvent(block: string): ChatStreamEvent | null {
  const dataLines = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());
  if (dataLines.length === 0) {
    return null;
  }
  try {
    return JSON.parse(dataLines.join("\n")) as ChatStreamEvent;
  } catch {
    return null;
  }
}

export async function* streamChat(request: ChatRequest): AsyncGenerator<ChatStreamEvent> {
  const form = new FormData();
  form.append("text", request.text);
  form.append("session_id", request.sessionId);
  if (request.audio) {
    form.append("audio", request.audio, "recording.webm");
  }
  if (request.image) {
    form.append("image", request.image);
  }

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: form
  });

  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }
  if (!response.body) {
    throw new Error("The chat stream is unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const event = parseStreamEvent(block);
      if (event) {
        yield event;
      }
    }
  }

  const trailing = parseStreamEvent(buffer);
  if (trailing) {
    yield trailing;
  }
}
