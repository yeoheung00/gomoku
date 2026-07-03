// apps/frontend/src/lib/socket.ts
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:4000";

// 💡 오직 단 하나의 소켓 인스턴스만 생성하여 내보냄
export const socket = io(SERVER_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false, // 브라우저 켜지면 자동 연결
});
