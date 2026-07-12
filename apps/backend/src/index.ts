import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

// ============================================================
// 1. 기본 설정
// ============================================================

const app = express();
const PORT = 4000;

// Express와 Socket.IO가 같은 HTTP 서버를 공유
const httpServer = createServer(app);

// 개발 중인 프론트엔드 주소
const CLIENT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Express HTTP API CORS 설정
app.use(
  cors({
    origin: CLIENT_ORIGINS,
    credentials: true, // 쿠키를 주고받기 위해 필요
  }),
);

// JSON 요청 body 파싱
app.use(express.json());

// Cookie 헤더를 req.cookies로 사용할 수 있게 해줌
app.use(cookieParser());

// Socket.IO 서버 생성
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },

  // 클라이언트 연결 상태 확인 설정
  pingTimeout: 5000,
  pingInterval: 10000,
});

// ============================================================
// 2. 상수
// ============================================================

const NONE = 0;
const BLACK = 1;
const WHITE = 2;
const SPECTATOR = 3;

// 세션 쿠키 이름
const SESSION_COOKIE_NAME = "mink-gomoku-session";

// ============================================================
// 3. 타입
// ============================================================

interface User {
  name: string;

  // 현재 참여 중인 게임방
  joinedRoom: string;

  // NONE / BLACK / WHITE / SPECTATOR
  role: number;
}

interface Session {
  // 이 세션이 어느 사용자의 것인지 연결
  userId: string;
}

interface GameRoom {
  board: number[][];
  isBlackTurn: boolean;
  winner: string | null;

  // 여기에는 userId를 저장
  players: string[];
  spectators: string[];
}

// ============================================================
// 4. 임시 메모리 저장소
// ============================================================
//
// 현재는 DB와 Redis가 없으므로 서버 메모리에 저장한다.
//
// 서버가 재시작되면 아래 데이터는 모두 사라진다.
// 추후:
//
// users    → PostgreSQL / MySQL 등 DB
// sessions → Redis 또는 세션 저장소
//
// 로 교체할 수 있다.
//

// userId → User
const users: Record<string, User> = {};

// sessionId → Session
const sessions: Record<string, Session> = {};

// roomId → GameRoom
const rooms: Record<string, GameRoom> = {};

// 빠른 매칭을 기다리는 userId 목록
const matchQueue: string[] = [];

// ============================================================
// 5. 개발용 로그 함수
// ============================================================

const log = (message: string, data?: unknown) => {
  console.log(message, data ?? "");
  console.log("---------------------------------------------");
};

const usersDisplay = () => {
  log("현재 사용자", users);
};

const sessionsDisplay = () => {
  log("현재 세션", sessions);
};

// ============================================================
// 6. 인증 헬퍼 함수
// ============================================================
//
// 요청의 HttpOnly 쿠키에서 sessionId를 읽고,
// 해당 세션과 사용자를 찾는다.
//
// 앞으로 /me, logout, 이름 변경 등에서 반복해서 사용 가능하다.
//

const getAuthenticatedUser = (req: express.Request) => {
  // 브라우저가 자동으로 전송한 쿠키에서 sessionId를 가져온다.
  const sessionId = req.cookies[SESSION_COOKIE_NAME];

  if (!sessionId || typeof sessionId !== "string") {
    return null;
  }

  // sessionId로 서버의 세션 저장소 조회
  const session = sessions[sessionId];

  if (!session) {
    return null;
  }

  // 세션에 연결된 userId로 사용자 조회
  const user = users[session.userId];

  if (!user) {
    return null;
  }

  return {
    sessionId,
    userId: session.userId,
    user,
  };
};

// ============================================================
// 7. 게스트 로그인
// ============================================================
//
// POST /api/auth/guest
//
// 1. 게스트 사용자 생성
// 2. 세션 생성
// 3. HttpOnly 쿠키 발급
// 4. 사용자 정보 반환
//

app.post("/api/auth/guest", (req, res) => {
  // 서버 내부에서 사용할 사용자 ID
  const userId = `gst_${crypto.randomUUID()}`;

  // 브라우저가 가지고 있을 세션 ID
  const sessionId = crypto.randomUUID();

  // 임시 게스트 이름
  const name = userId.slice(4, 10);

  // 사용자 생성
  users[userId] = {
    name,
    joinedRoom: "",
    role: NONE,
  };

  // 세션 생성
  sessions[sessionId] = {
    userId,
  };

  // HttpOnly 쿠키 발급
  //
  // JavaScript에서 document.cookie로 읽을 수 없다.
  // 브라우저가 이후 요청에 자동으로 첨부한다.
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,

    // 현재 개발환경은 http://localhost이므로 false
    // 실제 HTTPS 배포 환경에서는 true
    secure: false,

    // 기본적인 CSRF 방어에 도움
    sameSite: "lax",
  });

  usersDisplay();
  sessionsDisplay();

  return res.status(201).json({
    success: true,
    user: {
      id: userId,
      name,
    },
  });
});

// ============================================================
// 8. 현재 로그인 사용자 조회
// ============================================================
//
// GET /api/auth/me
//
// 클라이언트가 userId를 보내지 않는다.
//
// 브라우저
//   ↓ session cookie
// 서버
//   ↓ sessions[sessionId]
// userId 확인
//   ↓
// users[userId]
//   ↓
// 사용자 정보 반환
//

app.get("/api/auth/me", (req, res) => {
  const auth = getAuthenticatedUser(req);

  if (!auth) {
    return res.status(401).json({
      success: false,
      reason: "로그인되지 않았습니다.",
    });
  }

  return res.json({
    success: true,
    user: {
      id: auth.userId,
      name: auth.user.name,
    },
  });
});

// ============================================================
// 9. 이름 변경
// ============================================================
//
// PATCH /api/users/me/name
//
// 과거:
// PATCH /api/users/:userId/name
//
// 현재:
// PATCH /api/users/me/name
//
// 클라이언트가 userId를 직접 지정하지 않는다.
// 서버가 세션을 통해 현재 사용자를 판단한다.
//

app.patch("/api/users/me/name", (req, res) => {
  const auth = getAuthenticatedUser(req);

  if (!auth) {
    return res.status(401).json({
      success: false,
      reason: "로그인이 필요합니다.",
    });
  }

  const { name } = req.body;

  // 이름 유효성 검사
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      reason: "올바른 이름이 필요합니다.",
    });
  }

  // 서버의 사용자 정보 수정
  auth.user.name = name.trim();

  usersDisplay();

  return res.json({
    success: true,
    user: {
      id: auth.userId,
      name: auth.user.name,
    },
  });
});

// ============================================================
// 10. 로그아웃
// ============================================================
//
// POST /api/auth/logout
//
// 1. 현재 세션 확인
// 2. 세션 삭제
// 3. 게스트라면 임시 사용자도 삭제
// 4. 브라우저의 쿠키 삭제
//

app.post("/api/auth/logout", (req, res) => {
  const auth = getAuthenticatedUser(req);

  if (!auth) {
    return res.status(401).json({
      success: false,
      reason: "로그인되지 않았습니다.",
    });
  }

  // 세션 삭제
  delete sessions[auth.sessionId];

  // 현재는 게스트 사용자만 존재하므로 사용자도 삭제
  //
  // 추후 정식 계정이 추가되면:
  //
  // 게스트 → users에서 제거
  // 정식 계정 → DB 사용자 데이터는 유지
  //
  if (auth.userId.startsWith("gst_")) {
    delete users[auth.userId];
  }

  // 브라우저의 세션 쿠키 삭제
  //
  // 쿠키 삭제 시 생성할 때 사용했던 주요 옵션과
  // 일치시키는 것이 중요하다.
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  usersDisplay();
  sessionsDisplay();

  return res.json({
    success: true,
  });
});

// ============================================================
// 11. Socket.IO 연결
// ============================================================
//
// 중요:
//
// 현재 HTTP API는 세션 쿠키 기반 인증으로 바뀌었지만,
// Socket.IO 인증은 아직 완전히 세션 기반으로 변경하지 않았다.
//
// 다음 단계에서 Socket.IO handshake의 쿠키를 읽어
// sessionId → userId를 찾도록 변경할 예정이다.
//
// 현재는 임시로 기존 방식인 handshake.auth.userId를 사용한다.
//

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  // userId가 없거나 문자열이 아니면 연결 거부
  if (!userId || typeof userId !== "string") {
    log(`❌ userId가 없는 소켓 연결: ${socket.id}`);

    socket.disconnect();

    return;
  }

  // 서버에 실제로 존재하는 사용자인지 확인
  const user = users[userId];

  if (!user) {
    log(`❌ 등록되지 않은 사용자: ${userId}`);

    socket.disconnect();

    return;
  }

  // socket.data에 사용자 ID 저장
  //
  // 이후 이벤트마다 handshake.auth를 다시 읽지 않고
  // socket.data.userId를 사용할 수 있다.
  socket.data.userId = userId;

  // 사용자 전용 Socket.IO room
  //
  // 추후:
  //
  // io.to(`user:${userId}`).emit(...)
  //
  // 형태로 특정 사용자에게 이벤트를 보낼 수 있다.
  socket.join(`user:${userId}`);

  log(`🔌 소켓 연결: ${userId} / ${socket.id}`);

  // ==========================================================
  // 빠른 매칭 요청
  // ==========================================================

  socket.on("quick-match", () => {
    // 중복 등록 방지
    if (!matchQueue.includes(userId)) {
      matchQueue.push(userId);
    }

    log("🔍 빠른 매칭 요청", matchQueue);
  });

  // ==========================================================
  // 빠른 매칭 취소
  // ==========================================================

  socket.on("exit-quick-match", () => {
    const queueIndex = matchQueue.indexOf(userId);

    if (queueIndex !== -1) {
      matchQueue.splice(queueIndex, 1);
    }

    log("❌ 빠른 매칭 취소", matchQueue);
  });

  // ==========================================================
  // 소켓 연결 종료
  // ==========================================================

  socket.on("disconnect", () => {
    log(`❌ 소켓 연결 종료: ${userId}`);

    // 소켓 연결 종료는 로그아웃이 아니다.
    //
    // 새로고침
    // 인터넷 일시 끊김
    // 노트북 절전
    //
    // 등으로도 disconnect가 발생할 수 있기 때문에
    // users와 sessions는 삭제하지 않는다.

    // 다만 매칭 대기열에서는 제거
    const queueIndex = matchQueue.indexOf(userId);

    if (queueIndex !== -1) {
      matchQueue.splice(queueIndex, 1);
    }
  });
});

// ============================================================
// 12. 서버 시작
// ============================================================

httpServer.listen(PORT, () => {
  log(`🚀 멀티룸 오목 서버가 ${PORT}번 포트에서 구동 중입니다.`);
});
