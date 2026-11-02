import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { verifyToken } from "../lib/token.js";

/** Reads `Authorization: Bearer <token>` and puts the user id in `res.locals.userId`. */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    res.locals.userId = await verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Sign in required"));
  }
};
