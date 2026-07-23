import { Server } from "socket.io";
import { matchQueue } from "../store/store.js";
import { log } from "../utils/logger.js";
import { getAuthenticatedSocketUser } from "../auth/auth.js";
import { initMatcher } from "../matchmaking/matcher.js";


export function registerSocketRoutes(io: Server) {
  io.on("connection", (socket) => {
    const auth = getAuthenticatedSocketUser(socket);

    if (!auth) {
      log("인증 실패");
      socket.disconnect();
      return;
    }

    const { userId, user } = auth;
    socket.data.userId = userId;

    log(`🔌 소켓 연결: ${user.name} (${userId})`);

    socket.on("disconnect", () => {
      log(`❌ 소켓 연결 종료: ${userId}`);

      if (matchQueue[userId]) {
        delete matchQueue[userId]
      }
    });
  });
}
