import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const log = (msg: string, data?: any) => {
  console.log(msg, data ? data : "");
  console.log("---------------------------------------------");
};

const app = express();
const PORT = 4000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // 프론트엔드 주소 명시
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 5000, // 💡 클라이언트가 응답하지 않을 때 5초만 기다림
  pingInterval: 10000, // 💡 10초마다 생존 확인 신호(Ping)를 보냄
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
  name: string;
  joinedRoom: string;
  color: number;
}

const matchQueue: string[] = [];

const rooms: Record<string, GameRoom> = {};
const roomIds: string[] = [];
const players: Record<string, User> = {};

const playersDisplay = () => {
  log("플레이어", players);
};

io.on("connection", (socket) => {
  log(`🔌 유저 접속: ${socket.id}`);
  players[socket.id] = {
    name: socket.id.slice(0, 10),
    joinedRoom: "",
    color: NONE,
  };
  const player = players[socket.id];
  playersDisplay();

  socket.emit("initUser", { name: player.name });

  socket.on("updateName", (data: { name: string }, callback) => {
    const newName = data.name.trim();
    if (!newName)
      return callback({ success: false, reason: "이름은 공백일 수 없습니다." });
    if (newName.length > 10)
      return callback({
        success: false,
        reason: "이름은 10자 이하로 설정해주세요.",
      });
    const oldName = player.name;
    player.name = newName;
    log(`이름 변경 완료: [${oldName}] -> [${newName}]`);
    playersDisplay();
    callback({ success: true, updatedName: player.name });
  });

  socket.on("joinMatch", (callback) => {
    matchQueue.push(socket.id);
    if (!matchQueue.includes(socket.id)) {
      log(`대기열 참가 실패: ${socket.id}`);
      return callback({ success: false, reason: "대기열 참가 실패" });
    }
    log("현대 대기열: ", matchQueue);
    callback({ success: true, msg: "대기열 참가 성공" });

    if (matchQueue.length >= 2) {
      const p1Id = matchQueue.shift()!;
      const p2Id = matchQueue.shift()!;
      const p1 = players[p1Id];
      const p2 = players[p2Id];

      const newRoomId = crypto.randomUUID().substring(0, 8);

      rooms[newRoomId] = {
        board: Array(15)
          .fill(null)
          .map(() => Array(15).fill(0)),
        isBlackTurn: true,
        winner: null,
        players: [p1Id, p2Id],
      };

      const random = Math.random() < 0.5;
      if (p1) {
        p1.joinedRoom = newRoomId;
        p1.color = random ? BLACK : WHITE;
      }
      if (p2) {
        p2.joinedRoom = newRoomId;
        p2.color = random ? WHITE : BLACK;
      }

      io.to(p1Id).emit("matchSuccess", { roomId: newRoomId, color: p1.color });
      io.to(p2Id).emit("matchSuccess", { roomId: newRoomId, color: p2.color });

      log(`매칭 성사: ${newRoomId}`);
    }
  });

  socket.on("cancelMatch", (callback) => {
    const index = matchQueue.indexOf(socket.id);
    if (index !== -1) matchQueue.splice(index, 1);
    if (matchQueue.includes(socket.id)) {
      log("대기열 취소 실패: ", socket.id);
      return callback({ success: false, reason: "대기열 취소 실패" });
    }
    log("현재 대기열: ", matchQueue);
    callback({ success: true, msg: "대기열 취소 성공" });
  });

  socket.on("disconnect", () => {
    log(`❌ 유저 퇴장: ${socket.id}`);
    // 관리 편의상 유저가 나갔을 때의 방 비우기 로직은 추후 고도화 예정
    if (players[socket.id]) {
      const switchingName = players[socket.id].name;
      delete players[socket.id];
      console.log(`🗑️ 장부 제거 완료: [${switchingName}]`);
    }

    // 2. 🚶 만약 이 유저가 매칭 대기열(matchQueue)에 들어있던 상태라면 대기열에서도 즉시 투하
    const queueIndex = matchQueue.indexOf(socket.id);
    if (queueIndex !== -1) {
      matchQueue.splice(queueIndex, 1);
      console.log(
        `🚨 대기열에서 탈영병 제거 완료 (남은 대기 인원: ${matchQueue.length}명)`,
      );
    }
    playersDisplay();
  });
});

httpServer.listen(PORT, () => {
  log(`🚀 멀티룸 오목 서버가 구동 중입니다.`);
});
