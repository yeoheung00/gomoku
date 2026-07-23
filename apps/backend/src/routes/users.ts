import express from "express";
import { usersDisplay } from "../utils/logger.js";
import { getAuthenticatedUser } from "../auth/auth.js";


export function registerUserRoutes(app: express.Express) {

  app.patch("/api/users/me/name", (req, res) => {
    const auth = getAuthenticatedUser(req, res);

    if (!auth) {
      return res.status(401).json({
        success: false,
        reason: "로그인이 필요합니다.",
      });
    }

    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        reason: "올바른 이름이 필요합니다.",
      });
    }

    auth.user.name = name.trim();

    usersDisplay();

    return res.json({
      success: true,
      name: auth.user.name,
    });
  });
}
