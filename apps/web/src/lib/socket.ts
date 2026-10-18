"use client";

import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
      path: "/socket.io",
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 3,
      reconnectionDelay: 2500,
    });
  }
  return sharedSocket;
}
