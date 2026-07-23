import express, { CookieOptions } from "express";
import * as cookie from "cookie";
import { users } from "../store/store.js";
import { Socket } from "socket.io";
import jwt, { SignOptions } from "jsonwebtoken";
import { log } from "../utils/logger.js";
import { dayToMili } from "../utils/util.js";
import { getAccessTokenConfig } from "../config/config.js";

interface DecodedToken {
  userId: string;
  iat?: number;
  exp?: number;
}

const SECRET_KEY = process.env.SECRET_KEY ?? "top-secret";

export const initTokens = (res: express.Response, userId: string): string => {
  const isGuest = userId.startsWith("gst_");
  const newAccessToken = jwt.sign({ userId }, SECRET_KEY, { expiresIn: getAccessTokenConfig(true) as SignOptions['expiresIn'] });
  const newRefreshToken = jwt.sign({ userId }, SECRET_KEY, isGuest ? {} : { expiresIn: "7d" });

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax",
    maxAge: getAccessTokenConfig(false) as number,
  });

  const cookieOption:CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax",
  }

  res.cookie("refreshToken", newRefreshToken, isGuest ? cookieOption : { ...cookieOption, maxAge: dayToMili(7) });
  return newRefreshToken
};

export const getAuthenticatedUser = (req: express.Request, res: express.Response) => {
  const { accessToken, refreshToken } = req.cookies;
  const refreshAccessToken = () => {
    if (refreshToken && typeof refreshToken === "string") {
      try {
        const decoded = jwt.verify(refreshToken, SECRET_KEY) as DecodedToken;
        const user = users[decoded.userId];

        if (user && user.refreshToken === refreshToken) {
          const newRefreshToken  = initTokens(res, decoded.userId);

          user.refreshToken = newRefreshToken;

          log("토큰 갱신 성공", { userId: decoded.userId });

          return { userId: decoded.userId, user };
        }
      } catch (err) {
        log("리프레시 토큰 검증 실패", err);
        throw new Error("리프레시 토큰 검증 실패");
      }
    }
  }

  if (accessToken && typeof accessToken === "string") {
    try {
      const decoded = jwt.verify(accessToken, SECRET_KEY) as DecodedToken;
      const user = users[decoded.userId];
      if (user) return { userId: decoded.userId, user };
    } catch (err) {
      if(err instanceof jwt.TokenExpiredError) {
        log("액세스 토큰 만료", err);
        return refreshAccessToken();
      } else {
        log("액세스 토큰 검증 실패", err);
        throw new Error("액세스 토큰 검증 실패");
      }
    }
  }

  else if (refreshToken && typeof refreshToken === "string") {
      log("액세스 토큰 없음, 리프레시 토큰으로 갱신 시도");
      return refreshAccessToken();
    }

  return null;
};

export function getAuthenticatedSocketUser(socket: Socket) {
  const {accessToken} = cookie.parseCookie(socket.handshake.headers.cookie??"");
  const handshakeUserId = socket.handshake.auth.userId;

  if (!handshakeUserId) {
    return null;
  }

  if (accessToken && typeof accessToken === "string") {
    try {
      const decoded = jwt.verify(accessToken, SECRET_KEY) as DecodedToken;
      const user = users[decoded.userId];

      if (!user || decoded.userId !== handshakeUserId) {
        return null;
      }

      return {
        userId: decoded.userId,
        user,
      };
    } catch (err) {
      log("액세스 토큰 만료 또는 변조", err);
    }
  }
  return null;
}
