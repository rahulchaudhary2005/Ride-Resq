import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";
import type { User } from "@roadguard/shared-types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (token) {
        try {
          const { data } = await api.get("/users/me");
          setUser(data.data);
        } catch {
          await SecureStore.deleteItemAsync("accessToken");
        }
      }
      setLoading(false);
    })();
  }, []);

  async function persistSession(tokens: { accessToken: string; refreshToken: string }, u: User) {
    await SecureStore.setItemAsync("accessToken", tokens.accessToken);
    await SecureStore.setItemAsync("refreshToken", tokens.refreshToken);
    setUser(u);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    await persistSession(data.data, data.data.user);
  }

  async function register(input: { fullName: string; email: string; phone: string; password: string }) {
    const { data } = await api.post("/auth/register", { ...input, role: "MECHANIC" });
    await persistSession(data.data, data.data.user);
  }

  async function logout() {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (refreshToken) await api.post("/auth/logout", { refreshToken }).catch(() => {});
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
