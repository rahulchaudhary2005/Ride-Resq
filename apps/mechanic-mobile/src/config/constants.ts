const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const configuredSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();

export const API_BASE_URL =
  configuredApiUrl && configuredApiUrl.length > 0
    ? configuredApiUrl.replace(/\/$/, "")
    : "http://192.168.1.100:4000/api/v1";

export const SOCKET_URL =
  configuredSocketUrl && configuredSocketUrl.length > 0
    ? configuredSocketUrl.replace(/\/$/, "")
    : API_BASE_URL.replace(/\/api\/v1$/, "");
