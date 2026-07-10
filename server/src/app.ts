import express from "express";
import cors from "cors";
import type { Queryable } from "./db/pool.js";
import { contactRouter } from "./routes/contact.js";
import { bookingsRouter } from "./routes/bookings.js";

export function createApp(db: Queryable) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/contact", contactRouter(db));
  app.use("/api/bookings", bookingsRouter(db));

  return app;
}
