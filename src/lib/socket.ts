import { io, type Socket } from "socket.io-client";

const URL = import.meta.env.VITE_BASE_URL ?? "";

let socket: Socket | null = null;

// Single shared connection, authed with the same token used for REST.
// `auth` is a function so the freshest token is sent on every (re)connect.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      auth: (cb) => cb({ token: localStorage.getItem("token") ?? "" }),
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
