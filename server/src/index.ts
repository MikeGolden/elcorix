import "./env.js";
import { createApp } from "./app.js";
import { pool } from "./db/pool.js";
import { startRetentionCleanup } from "./retention.js";

const port = Number(process.env.PORT ?? 3001);

const server = createApp(pool).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

const stopRetentionCleanup = startRetentionCleanup(pool);

// Graceful shutdown: stop accepting connections, let in-flight requests
// finish, close the pool. Docker sends SIGTERM on `compose down`/redeploy;
// without this the container is hard-killed after the stop timeout.
let shuttingDown = false;
function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  stopRetentionCleanup();
  server.close((err) => {
    pool
      .end()
      .catch((poolErr) => console.error("Failed to close database pool:", poolErr))
      .finally(() => process.exit(err ? 1 : 0));
  });
  // Safety net: don't hang forever on stuck keep-alive connections.
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 8000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
