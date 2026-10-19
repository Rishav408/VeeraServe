import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiPost } from "../lib/apiClient";
import { clearToken, getToken, setToken } from "../lib/authToken";
import { STORAGE_KEYS } from "../utils/storageKeys";
import type { LoginRequest, RegisterRequest, TokenResponse, UserDto } from "../types/api";

interface AuthContextValue {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<UserDto>;
  register: (payload: RegisterRequest) => Promise<UserDto>;
  logout: () => void;
  updateUser: (user: UserDto) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): UserDto | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<UserDto | null>(() => (getToken() ? readStoredUser() : null));

  const applySession = useCallback((session: TokenResponse) => {
    setToken(session.access_token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
    setTokenState(session.access_token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await apiPost<LoginRequest, TokenResponse>("/auth/login", payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const session = await apiPost<RegisterRequest, TokenResponse>("/auth/register", payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(STORAGE_KEYS.user);
    setTokenState(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((next: UserDto) => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
    setUser(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      updateUser
    }),
    [user, token, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
