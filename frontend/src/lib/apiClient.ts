import { API_URL } from "../utils/config";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_URL}${path}`).then(parse<T>);
}

export function apiPost<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(parse<TResponse>);
}

export function apiPostForm<TResponse>(path: string, formData: FormData): Promise<TResponse> {
  return fetch(`${API_URL}${path}`, { method: "POST", body: formData }).then(parse<TResponse>);
}
