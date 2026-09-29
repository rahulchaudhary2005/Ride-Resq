import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
});

// Admin session token stored in an httpOnly cookie in production (set by a /api/session
// route that proxies login). For this scaffold we read a plain cookie for simplicity.
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("adminToken="))
      ?.split("=")[1];
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}
