import { Server } from "socket.io";
import { games } from "../store/store.js";
import { BLACK, WHITE, SPECTATOR } from "./constants.js";
import { log } from "../utils/logger.js";
import { winningCondition } from "./rule.js";



export const initGame = (io: Server) => {
  io.on("connection", (socket) => {
    // 1. 방 입장 (지정된 플레이어 또는 관전자 판별)
    socket.on("enter-room", (data: { gameId: string, userId: string }, callback) => {
      const game = games[data.gameId];
      if (!game) {
        callback({ status: "error", msg: "방이 존재하지 않습니다." });
        return;
      }

      socket.join(data.gameId);

      // 지정된 플레이어인지 확인
      const playerIndex = game.players.findIndex((p) => p.userId === data.userId);

      if (playerIndex !== -1) {
        // [플레이어로 입장/재접속]
        game.players[playerIndex].socketId = socket.id;
        game.players[playerIndex].connected = true;

        // 방 안에 있는 모든 사람에게 플레이어 연결 상태 변경 브로드캐스트
        io.to(data.gameId).emit("update-players", game.players);
      } else {
        // [관전자로 입장]
        if (!game.spectators.includes(data.userId)) {
          game.spectators.push(data.userId);
        }
      }

      // 초기 데이터 전송
      socket.emit("init-data", game, () => {
        log("init-data", game);
      });
    });

    socket.on("placement", (data: { x: number, y: number, userId: string }) => {
      const rooms = Array.from(socket.rooms);
      const roomId = rooms.find((room) => room !== socket.id);
      if (!roomId) return;
      const game = games[roomId]; // 메모리/스토어의 방 데이터
      if (game.players[game.currentTurn].userId !== data.userId) return;
      game.board[data.y][data.x] = data.userId === game.players[BLACK].userId ? BLACK : WHITE;
      const isGameOver = winningCondition(game.board, data.x, data.y, game.currentTurn);
      game.winner = isGameOver ? game.players[game.currentTurn].userId : null;
      game.currentTurn = (game.currentTurn + 1) % 2;
      io.to(roomId).emit("update-board", { board: game.board, currentTurn: game.currentTurn });
      if(isGameOver) {
        io.to(roomId).emit("game-over", game.winner );
      }
    })

    // 2. 연결 끊김 (탈주/새로고침) 처리
    socket.on("disconnect", () => {
      // 어떤 방의 어떤 플레이어가 나갔는지 찾아서 처리
      for (const gameId in games) {
        const game = games[gameId];
        const player = game.players.find((p) => p.socketId === socket.id);

        if (player) {
          player.connected = false;
          player.socketId = null;

          // 상대방(및 관전자)에게 이 플레이어가 접속 해제 상태임을 알림
          io.to(gameId).emit("update-players", game.players);
          log("info", `Player ${player.userId} disconnected from room ${gameId}`);
          break;
        }
      }
    });
  });
};
