import express from "express";
import { log, usersDisplay } from "../utils/logger.js";
import { users } from "../store/store.js";
import { getAccessTokenConfig, SECRET_KEY } from "../config/config.js";
import { getAuthenticatedUser, initTokens } from "../auth/auth.js";
import jwt, {SignOptions} from "jsonwebtoken";
import 'dotenv/config';


export function registerAuthRoutes(app: express.Express) {
  app.post("/api/auth/guest", (req, res) => {
    log("게스트 로그인 요청");
    const id = `gst_${crypto.randomUUID()}`;
    const name = id.slice(4, 10);

    const refreshToken = initTokens(res, id);

    users[id] = {
      name,
      win: 0,
      lose: 0,
      refreshToken,
    };

    usersDisplay();

    return res.status(201).json({
      success: true,
      user: {
        id,
        name,
      },
    });
  });

  app.get("/api/auth/me", (req, res) => {
    log(req.cookies);
    const auth = getAuthenticatedUser(req, res);

    if (!auth) {
      return res.status(401).json({
        success: false,
        reason: "로그인되지 않았습니다.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: auth.userId,
        name: auth.user.name,
      },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    const auth = getAuthenticatedUser(req, res);

    if (!auth) {
      return res.status(401).json({
        success: false,
        reason: "로그인되지 않았습니다.",
      });
    }

    if (auth.userId.startsWith("gst_")) {
      delete users[auth.userId];
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    usersDisplay();

    return res.json({
      success: true,
    });
  });

  app.get('/api/auth/check-auth', (req, res) => {
    const auth = getAuthenticatedUser(req, res);

    if (!auth) {
      return res.status(401).json({
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
    });
  });
}
