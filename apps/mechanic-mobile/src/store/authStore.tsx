import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";
import { disconnectSocket } from "../services/socket";
import type { User } from "@roadguard/shared-types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email: string; phone: string; password: string; phoneVerificationToken: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (token) {
          const { data } = await api.get("/users/me");
          const restoredUser = data.data as User;
          if (restoredUser.role !== "MECHANIC") throw new Error("Account is not a mechanic");
          if (active) setUser(restoredUser);
        }
      } catch {
        await SecureStore.deleteItemAsync("accessToken").catch(() => undefined);
        await SecureStore.deleteItemAsync("refreshToken").catch(() => undefined);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function persistSession(tokens: { accessToken: string; refreshToken: string }, u: User) {
    await SecureStore.setItemAsync("accessToken", tokens.accessToken);
    await SecureStore.setItemAsync("refreshToken", tokens.refreshToken);
    setUser(u);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    const user = data.data.user as User;
    if (user.role !== "MECHANIC") throw new Error("This account does not have mechanic access.");
    await persistSession(data.data, user);
  }

  async function register(input: { fullName: string; email: string; phone: string; password: string; phoneVerificationToken: string }) {
    const { data } = await api.post("/auth/register", { ...input, role: "MECHANIC" });
    await persistSession(data.data, data.data.user);
  }

  async function logout() {
    disconnectSocket();
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (refreshToken) await api.post("/auth/logout", { refreshToken }).catch(() => { });
    } finally {
      setUser(null);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    }
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
