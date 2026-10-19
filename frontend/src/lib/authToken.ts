import { STORAGE_KEYS } from "../utils/storageKeys";

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.token, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
}
