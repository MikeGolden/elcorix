import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import type { Queryable } from "../db/pool.js";

const query = vi.fn();
const db = { query } as unknown as Queryable;

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ rows: [{ id: 1, status: "pending" }] });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("security headers", () => {
  it("sets helmet headers and hides x-powered-by", async () => {
    const res = await request(createApp(db)).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("CORS", () => {
  it("does not allow cross-origin calls by default", async () => {
    const res = await request(createApp(db))
      .get("/api/health")
      .set("Origin", "https://evil.example.com");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows only the configured origins", async () => {
    const app = createApp(db, { corsOrigins: ["https://kosmetic-fuessen.de"] });
    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "https://kosmetic-fuessen.de");
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://kosmetic-fuessen.de",
    );
    const denied = await request(app)
      .get("/api/health")
      .set("Origin", "https://evil.example.com");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("rate limiting", () => {
  it("returns 429 once the write limit is exceeded", async () => {
    const app = createApp(db, { rateLimitMax: 2 });
    const valid = { name: "Anna", email: "anna@example.com", message: "Hi" };
    expect((await request(app).post("/api/contact").send(valid)).status).toBe(201);
    expect((await request(app).post("/api/contact").send(valid)).status).toBe(201);
    const limited = await request(app).post("/api/contact").send(valid);
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: "Too many requests, please try again later",
    });
  });

  it("does not rate-limit health checks", async () => {
    const app = createApp(db, { rateLimitMax: 1 });
    for (let i = 0; i < 5; i += 1) {
      expect((await request(app).get("/api/health")).status).toBe(200);
    }
  });
});

describe("request body hardening", () => {
  it("rejects malformed JSON with a JSON error, not an HTML page", async () => {
    const res = await request(createApp(db))
      .post("/api/contact")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request" });
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects bodies over the size limit and says so", async () => {
    const res = await request(createApp(db))
      .post("/api/contact")
      .send({ name: "A", email: "a@b.co", message: "x".repeat(40_000) });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: "Request body is too large" });
    expect(query).not.toHaveBeenCalled();
  });

  it("lets a full-length multibyte message reach the field validation", async () => {
    // 5000 characters is the documented maximum, and Cyrillic costs two
    // bytes each: under a 16kb body limit this was rejected by the parser
    // as a malformed request instead of being accepted.
    const res = await request(createApp(db))
      .post("/api/contact")
      .send({ name: "Анна", email: "a@b.co", message: "щ".repeat(5000) });
    expect(res.status).toBe(201);
    expect(query).toHaveBeenCalled();
  });

  it("still reports an over-length message as a field error, not a size error", async () => {
    const res = await request(createApp(db))
      .post("/api/contact")
      .send({ name: "A", email: "a@b.co", message: "x".repeat(5001) });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Message is too long" });
    expect(query).not.toHaveBeenCalled();
  });

  it("answers unknown API routes with JSON, not Express's HTML page", async () => {
    const res = await request(createApp(db)).post("/api/nope").send({});
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it.each([
    ["contact name", "/api/contact", { name: "x".repeat(201), email: "a@b.co", message: "hi" }],
    ["contact email", "/api/contact", { name: "A", email: `${"x".repeat(310)}@example.com`, message: "hi" }],
    ["booking name", "/api/bookings", { customerName: "x".repeat(201), customerPhone: "+49123" }],
    ["booking phone", "/api/bookings", { customerName: "Anna", customerPhone: "1".repeat(51) }],
    ["booking service", "/api/bookings", { customerName: "Anna", customerPhone: "+49123", service: "x".repeat(201) }],
  ])("rejects oversized field: %s", async (_label, path, payload) => {
    const res = await request(createApp(db)).post(path).send(payload);
    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("Altegio company id sanitization", () => {
  it("uses a digits-only id from the environment", async () => {
    vi.stubEnv("ALTEGIO_COMPANY_ID", "123456");
    const res = await request(createApp(db)).get("/api/bookings/link");
    expect(res.body.url).toBe("https://n123456.alteg.io");
  });

  it("falls back to the placeholder when the env value could alter the URL", async () => {
    vi.stubEnv("ALTEGIO_COMPANY_ID", "123.evil.example.com/#");
    const res = await request(createApp(db)).get("/api/bookings/link");
    expect(res.body.url).toBe("https://n000000.alteg.io");
  });
});
