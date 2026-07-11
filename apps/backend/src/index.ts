import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const log = (msg: string, data?: unknown) => {
  console.log(msg, data ?? "");
  console.log("---------------------------------------------");
};

const app = express();
const PORT = 4000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 5000,
  pingInterval: 10000,
});

const NONE = 0;
const BLACK = 1;
const WHITE = 2;
const SPECTATOR = 3;

interface GameRoom {
  board: number[][];
  isBlackTurn: boolean;
  winner: string | null;
  players: string[];
  spectators: string[];
}

interface User {
  name: string;
  socketId: string;
  joinedRoom: string;
  role: number;
}

const matchQueue: string[] = [];

const rooms: Record<string, GameRoom> = {};
const players: Record<string, User> = {};

const playersDisplay = () => {
  log("플레이어", players);
};

io.on("connection", (socket) => {
  // SocketContext에서 socket.auth = { userId }로 전달한 값
  const userId = socket.handshake.auth.userId;

  if (!userId || typeof userId !== "string") {
    log(`❌ 사용자 ID가 없는 연결: ${socket.id}`);
    socket.disconnect();
    return;
  }

  if (players[userId]) {
    log(`❌ 이미 접속 중인 사용자: ${userId}`);
    socket.disconnect();
    return;
  }

  let name = "";

  if (userId.startsWith("gst_")) {
    name = userId.slice(4, 10);
  } else {
    // TODO:
    // 정식 로그인 사용자는 DB에서 사용자 정보 조회
    name = userId;
  }

  players[userId] = {
    name,
    socketId: socket.id,
    joinedRoom: "",
    role: NONE,
  };

  // 이 연결에서 사용할 사용자 객체
  const player = players[userId];

  log(`🔌 유저 접속: ${userId}`);
  playersDisplay();

  socket.on("quick-match", () => {
    log(`🔍 ${userId}이(가) 퀵 매칭을 요청했습니다.`);
    matchQueue.push(userId);
    playersDisplay();
  });

  socket.on("exit-quick-match", () => {
    log(`❌ ${userId}이(가) 퀵 매칭을 취소했습니다.`);
    const queueIndex = matchQueue.indexOf(userId);
    if (queueIndex !== -1) {
      matchQueue.splice(queueIndex, 1);
    }
    playersDisplay();
  });

  socket.on("disconnect", () => {
    log(`❌ 유저 퇴장: ${userId}`);

    // 현재 연결의 socketId와 일치할 때만 삭제
    if (players[userId]?.socketId === socket.id) {
      delete players[userId];
    }

    // 매칭 대기열에서도 제거
    const queueIndex = matchQueue.indexOf(userId);

    if (queueIndex !== -1) {
      matchQueue.splice(queueIndex, 1);
    }

    playersDisplay();
  });
});

httpServer.listen(PORT, () => {
  log("🚀 멀티룸 오목 서버가 구동 중입니다.");
});
