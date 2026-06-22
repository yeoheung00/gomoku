import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const divide = () => console.log("------------------");

const app = express();
const PORT = 4000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // 프론트엔드 주소 명시
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const NONE = 0;
const BLACK = 1;
const WHITE = 2;

// 🏢 방별 게임 상태를 저장할 인메모리 데이터베이스 구조
interface GameRoom {
  board: number[][];
  isBlackTurn: boolean;
  winner: string | null;
  players: string[]; // 접속한 유저들의 소켓 ID 목록
}

interface User {
  joinedRoom: number;
  color: number;
}

const rooms: Record<string, GameRoom> = {};
const roomIds: string[] = [];
const players: Record<string, User> = {};

io.on("connection", (socket) => {
  console.log(`🔌 유저 접속: ${socket.id}`);
  players[socket.id] = { joinedRoom: 0, color: NONE };
  console.log("현재 플레이어 목록: ", players);
  divide();

  socket.on("makeRoom", (data: { id: string }, callback) => {
    if (rooms[data.id]) {
      callback({ success: false, reason: "이미 존재하는 방입니다." });
    } else {
      rooms[data.id] = {
        board: Array(15)
          .fill(null)
          .map(() => Array(15).fill(0)),
        isBlackTurn: true,
        winner: null,
        players: [socket.id],
      };
      roomIds.push(data.id);
      io.emit("refreshRooms", { roomIds: roomIds });
      callback({ success: true, reason: "생성 성공" });
      console.log("현재 존재하는 방: ", rooms);
      divide();
    }
  });

  socket.on("exitRoom", (data: { id: string }, callback) => {
    const room = rooms[data.id];
    if (room) {
      if (room.players.includes(socket.id)) {
        room.players.splice(room.players.indexOf(socket.id), 1);
      }
    }
    if (room.players.length === 0) {
      delete rooms[data.id];
      roomIds.splice(roomIds.indexOf(data.id), 1);
    }
    io.emit("refreshRooms", { roomIds: roomIds });
    console.log("현재 존재하는 방: ", rooms);
    if (callback) callback({ success: true, reason: "퇴장 성공" });
    divide();
  });

  socket.on("joinRoom", (data: { roomId: string }, callback) => {
    const room = rooms[data.roomId];
    if (room) {
      if (room.players.length < 2) {
        room.players.push(socket.id);
        if (callback) callback({ success: true, reason: "방 참가 성공" });
      } else if (callback)
        callback({ success: false, reason: "방 참가 실패 인원 초과" });
    } else if (callback)
      callback({
        success: false,
        reason: `방 참가 실패 [${data.roomId}]방이 존재하지 않음.`,
      });
  });

  socket.on("disconnect", () => {
    console.log(`❌ 유저 퇴장: ${socket.id}`);
    // 관리 편의상 유저가 나갔을 때의 방 비우기 로직은 추후 고도화 예정
    delete players[socket.id];
    console.log("현재 플레이어 목록: ", players);
    divide();
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 멀티룸 오목 서버가 구동 중입니다.`);
});
