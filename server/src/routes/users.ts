import { Router } from "express";
import { HttpError } from "../lib/http-error.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (_req, res) => {
  const user = await User.findById(res.locals.userId);
  if (!user) throw new HttpError(401, "Sign in required");
  res.json({
    username: user.username ?? null,
    email: user.email,
    createdAt: user.createdAt,
  });
});
