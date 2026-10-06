import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { SOCKET_URL } from "../config/constants";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: (callback) => {
      SecureStore.getItemAsync("accessToken")
        .then((token) => callback({ token }))
        .catch(() => callback({ token: null }));
    },
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
