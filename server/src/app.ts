import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { notesRouter } from "./routes/notes.js";

const clientDist = fileURLToPath(new URL("../../client/dist", import.meta.url));

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/notes", notesRouter);
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
