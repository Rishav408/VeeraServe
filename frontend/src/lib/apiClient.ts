import { API_URL } from "../utils/config";
import { clearToken, getToken } from "./authToken";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function messageFromDetail(status: number, detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (typeof first?.msg === "string") {
      return first.msg;
    }
  }
  return `Request failed with status ${status}`;
}

function buildHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  const token = getToken();
  if (token) {
    merged.set("Authorization", `Bearer ${token}`);
  }
  return merged;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: buildHeaders(init.headers)
  });

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok) {
    let detail: unknown = null;
    try {
      const body = (await response.json()) as { detail?: unknown };
      detail = body.detail ?? body;
    } catch {
      detail = null;
    }
    throw new ApiError(response.status, messageFromDetail(response.status, detail), detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export function apiPatch<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export function apiDelete<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path, { method: "DELETE" });
}

export function apiPostForm<TResponse>(path: string, formData: FormData): Promise<TResponse> {
  return request<TResponse>(path, { method: "POST", body: formData });
}
