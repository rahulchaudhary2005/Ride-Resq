import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { SOCKET_URL } from "../config/constants";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await SecureStore.getItemAsync("accessToken");
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
