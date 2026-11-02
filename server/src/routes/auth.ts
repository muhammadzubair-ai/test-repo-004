import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/token.js";
import { requireAuth } from "../middleware/auth.js";
import { User, toPublicUser } from "../models/user.js";

export const authRouter = Router();

const Register = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(200),
});
const Login = z.object({
  identifier: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(200),
});

authRouter.post("/register", async (req, res) => {
  const input = Register.parse(req.body);
  if (await User.exists({ email: input.email.toLowerCase() })) throw new HttpError(409, "That email is already registered");
  const user = await User.create({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password) });
  res.status(201).json({ token: await signToken(user.id), user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const input = Login.parse(req.body);
  const identifier = input.identifier;
  const byEmail = await User.findOne({ email: identifier.toLowerCase() }).select("+passwordHash");
  const user = byEmail ?? (await User.findOne({ username: identifier }).select("+passwordHash"));
  // Unknown identifier and wrong password share one response so the route does not reveal which accounts exist.
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new HttpError(401, "INVALID_CREDENTIALS");
  res.json({
    token: await signToken(user.id),
    user: { id: user.id as string, username: user.username ?? null, email: user.email },
  });
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  const user = await User.findById(res.locals.userId);
  if (!user) throw new HttpError(401, "Sign in required");
  res.json({ user: toPublicUser(user) });
});
