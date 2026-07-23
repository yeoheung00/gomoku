import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { PORT, CLIENT_ORIGINS } from "./config/config.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerSocketRoutes } from "./socket/socket.js";
import { log } from "./utils/logger.js";
import { initMatcher } from "./matchmaking/matcher.js";
import { initGame } from "./game/game.js";

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerAuthRoutes(app);
registerUserRoutes(app);
registerSocketRoutes(io);
initMatcher(io);
initGame(io);

httpServer.listen(PORT, () => {
  log(`🚀 멀티룸 오목 서버가 ${PORT}번 포트에서 구동 중입니다.`);
});
