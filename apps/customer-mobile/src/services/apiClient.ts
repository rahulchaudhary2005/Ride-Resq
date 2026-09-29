import axios from "axios";
import * as SecureStore from "expo-secure-store";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL =
  configuredApiUrl && configuredApiUrl.length > 0
    ? configuredApiUrl.replace(/\/$/, "")
    : "http://192.168.1.100:4000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    const refreshToken = await SecureStore.getItemAsync("refreshToken");

    if (!refreshToken) {
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: 15000 }
      );

      await SecureStore.setItemAsync("accessToken", data.data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.data.refreshToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;

      return apiClient(original);
    } catch {
      return Promise.reject(error);
    }
  }
);
