import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Android emulators reach the host machine through 10.0.2.2. Set
// EXPO_PUBLIC_API_URL to the backend's LAN address when using a physical phone.
const defaultApiUrl = Platform.OS === "android"
  ? "http://10.0.2.2:4000/api/v1"
  : "http://localhost:4000/api/v1";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, attempt a silent refresh once, then retry the original request.
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          await SecureStore.setItemAsync("accessToken", data.data.accessToken);
          await SecureStore.setItemAsync("refreshToken", data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return apiClient(original);
        } catch {
          // fall through to reject; caller should route to login
        }
      }
    }
    return Promise.reject(error);
  }
);
