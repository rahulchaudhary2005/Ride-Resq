import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./apiClient";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket) return socket;

  const socketUrl = API_BASE_URL.replace("/api/v1", "");

  socket = io(socketUrl, {
    auth: (callback) => {
      SecureStore.getItemAsync("accessToken")
        .then((token) => callback({ token }))
        .catch(() => callback({ token: null }));
    },
    transports: ["websocket"],
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
