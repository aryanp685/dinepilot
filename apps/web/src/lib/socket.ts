"use client";

import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/socket.io",
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
  }
  return sharedSocket;
}
