import { Router } from "express";
import { pingDb } from "../db.js";
import { checkHealth } from "../lib/health.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const health = await checkHealth(pingDb);
  res.status(health.status === "ok" ? 200 : 503).json(health);
});
