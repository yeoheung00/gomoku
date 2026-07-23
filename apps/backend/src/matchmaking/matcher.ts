import { Server, Socket } from "socket.io";
import { matchQueue, games } from "../store/store.js";
import { log } from "../utils/logger.js";
import { BLACK, WHITE } from "../game/constants.js";
import { users } from "../store/store.js";


type Callback = (res: { status: string; msg: string }) => void;

export const initMatcher = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on("quick-match", (callback: Callback) => {
      handleJoinQueue(socket, io, callback);
      log("🔍 빠른 매칭 요청", matchQueue);
    });

    socket.on("exit-quick-match", (callback: Callback) => {
      removeFromQueue(socket.data.userId, callback);

      log("❌ 빠른 매칭 취소", matchQueue);
    });

    socket.on("disconnect", () => {
      // 소켓이 끊길 때 매칭 중이었다면 제거
      if (socket.data.userId) {
        removeFromQueue(socket.data.userId);
      }
    });
  });
};
const handleJoinQueue = (socket: Socket, io: Server, callback: Callback) => {
  const userId = socket.data.userId;
  const socketId = socket.id;

  // 1. 이미 대기 중인지 체크
  if (matchQueue[userId]) return;

  // 2. 대기자가 있는지 확인 (첫 번째 대기자 찾기)
  const waitingUserIds = Object.keys(matchQueue);

  if (waitingUserIds.length > 0) {
    const opponentId = waitingUserIds[0];
    const opponentSocketId = matchQueue[opponentId];

    // 3. 매칭 성사: 큐에서 대기자 제거
    delete matchQueue[opponentId];

    let gameId = crypto.randomUUID().slice(0, 8);
    while (games[gameId]) gameId = crypto.randomUUID().slice(0, 8);

    socket.join(gameId);
    io.sockets.sockets.get(opponentSocketId)?.join(gameId);

    const createEmptyBoard = (size: number = 15): number[][] => {
      return Array.from({ length: size }, () => Array(size).fill(-1));
    };
    const amIBlack = Math.random() < 0.5;
    let players = [
      { name: users[userId].name, userId: userId, socketId: socketId, connected: false },
      { name: users[opponentId].name, userId: opponentId, socketId: opponentSocketId, connected: false },
    ];
    if (!amIBlack) {
      players = players.reverse();
    }
    games[gameId] = {
      board: createEmptyBoard(),
      currentTurn: BLACK,
      winner: null,
      players,
      spectators: [],
    };

    io.to(gameId).emit("game-start", {
      gameId
    });
    log("매칭 성공", players);
    callback({
      status: "ok",
      msg: "매칭 성공",
    });
  } else {
    matchQueue[userId] = socketId;
    callback({
      status: "ok",
      msg: "매칭 대기열 등록 성공",
    });
  }
};

const removeFromQueue = (userId: string, callback?: Callback) => {
  const target = matchQueue[userId];
  if (target) {
    delete matchQueue[userId];
    log("대기열에서 제거됨", { userId });
    if (callback)
      callback({
        status: "ok",
        msg: "대기열에서 제거됨",
      });
  } else {
    log("대기열에 없음", { userId });
    if (callback)
      callback({
        status: "error",
        msg: "대기열에 없음",
      });
  }
};
