import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

/** Pings the database; the health route and its unit test share this shape. */
export async function pingDb() {
  await mongoose.connection.db?.admin().ping();
  if (mongoose.connection.readyState !== 1) throw new Error("not connected");
}
