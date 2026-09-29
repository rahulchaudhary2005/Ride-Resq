import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import { apiClient } from "../services/apiClient";
import type { User } from "@roadguard/shared-types";

interface AuthState {
  user: User | null;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;

  logout: () => Promise<void>;

  hydrate: () => Promise<void>;
}

interface AuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

interface MeResponse {
  data: User;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  async login(email, password) {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const { accessToken, refreshToken, user } =
      response.data.data;

    await SecureStore.setItemAsync(
      "accessToken",
      accessToken
    );

    await SecureStore.setItemAsync(
      "refreshToken",
      refreshToken
    );

    set({
      user,
      isLoading: false,
    });
  },

  async register(input) {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      {
        ...input,
        role: "CUSTOMER",
      }
    );

    const { accessToken, refreshToken, user } =
      response.data.data;

    await SecureStore.setItemAsync(
      "accessToken",
      accessToken
    );

    await SecureStore.setItemAsync(
      "refreshToken",
      refreshToken
    );

    set({
      user,
      isLoading: false,
    });
  },

  async logout() {
    try {
      const refreshToken =
        await SecureStore.getItemAsync("refreshToken");

      if (refreshToken) {
        await apiClient
          .post("/auth/logout", {
            refreshToken,
          })
          .catch(() => { });
      }
    } finally {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");

      set({
        user: null,
        isLoading: false,
      });
    }
  },

  async hydrate() {
    try {
      const accessToken =
        await SecureStore.getItemAsync("accessToken");

      if (!accessToken) {
        set({
          user: null,
          isLoading: false,
        });

        return;
      }

      const response = await apiClient.get<MeResponse>(
        "/users/me"
      );

      set({
        user: response.data.data,
        isLoading: false,
      });
    } catch (error) {
      console.warn(
        "Auth hydration failed. Starting as logged out.",
        error
      );

      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");

      set({
        user: null,
        isLoading: false,
      });
    }
  },
}));