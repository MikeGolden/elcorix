import "./env.js";
import { createApp } from "./app.js";
import { pool } from "./db/pool.js";

const port = Number(process.env.PORT ?? 3001);

createApp(pool).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
