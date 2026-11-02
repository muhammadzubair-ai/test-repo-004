import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./db.js";
import { env } from "./env.js";

await connectDb();
const server = createApp().listen(env.PORT, () => console.log(`API on http://localhost:${env.PORT}`));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => void disconnectDb().then(() => process.exit(0)));
  });
}
