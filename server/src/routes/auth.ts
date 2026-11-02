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
const Login = z.object({ email: z.email(), password: z.string().min(1) });

authRouter.post("/register", async (req, res) => {
  const input = Register.parse(req.body);
  if (await User.exists({ email: input.email.toLowerCase() })) throw new HttpError(409, "That email is already registered");
  const user = await User.create({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password) });
  res.status(201).json({ token: await signToken(user.id), user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const input = Login.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  // The same message for an unknown email and a wrong password, so the route does not reveal which emails exist.
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new HttpError(401, "Wrong email or password");
  res.json({ token: await signToken(user.id), user: toPublicUser(user) });
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  const user = await User.findById(res.locals.userId);
  if (!user) throw new HttpError(401, "Sign in required");
  res.json({ user: toPublicUser(user) });
});
