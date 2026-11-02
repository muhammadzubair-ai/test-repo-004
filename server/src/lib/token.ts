import { SignJWT, jwtVerify } from "jose";
import { env } from "../env.js";

const key = new TextEncoder().encode(env.JWT_SECRET);

export function signToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(key);
}

/** Returns the user id the token was issued for; throws when it is invalid or expired. */
export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
  if (!payload.sub) throw new Error("token has no subject");
  return payload.sub;
}
