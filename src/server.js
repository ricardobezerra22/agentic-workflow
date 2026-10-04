import { app } from "./app.js";
import { pool } from "./db.js";
import "dotenv/config";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Listening on http://127.0.0.1:${PORT}`);
});

function shutdown() {
  server.close(() => pool.end().then(() => process.exit(0)));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
