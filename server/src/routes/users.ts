import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";

export const usersRouter = Router();

const PasswordChange = z.object({
  oldPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

usersRouter.put("/me/password", requireAuth, async (req, res) => {
  const input = PasswordChange.parse(req.body);
  const user = await User.findById(res.locals.userId).select("+passwordHash");
  if (!user) throw new HttpError(401, "Sign in required");
  if (!(await verifyPassword(input.oldPassword, user.passwordHash))) throw new HttpError(401, "OLD_PASSWORD_INVALID");
  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();
  res.status(204).send();
});
