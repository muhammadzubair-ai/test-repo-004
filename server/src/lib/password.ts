import bcrypt from "bcryptjs";
import { env } from "../env.js";

/** Hashes a password or a security answer with the configured bcrypt cost. */
export const hashSecret = (value: string) => bcrypt.hash(value, env.BCRYPT_ROUNDS);

export const hashPassword = (password: string) => hashSecret(password);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
