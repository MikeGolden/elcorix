import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { validateContact } from "../routes/contact.js";
import type { Queryable } from "../db/pool.js";

const query = vi.fn();
const db = { query } as unknown as Queryable;
const app = createApp(db);

beforeEach(() => {
  query.mockReset();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/contact", () => {
  const valid = { name: "Anna", email: "anna@example.com", message: "Hi" };

  it("stores a valid message", async () => {
    query.mockResolvedValue({ rows: [{ id: 42, created_at: new Date() }] });
    const res = await request(app).post("/api/contact").send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 42 });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT"), [
      "Anna",
      "anna@example.com",
      "Hi",
    ]);
  });

  it.each([
    [{ ...valid, name: "" }, "name"],
    [{ ...valid, email: "not-an-email" }, "email"],
    [{ ...valid, message: "" }, "message"],
  ])("rejects invalid payload %#", async (payload) => {
    const res = await request(app).post("/api/contact").send(payload);
    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns 500 when the database fails", async () => {
    query.mockRejectedValue(new Error("db down"));
    const res = await request(app).post("/api/contact").send(valid);
    expect(res.status).toBe(500);
  });
});

describe("validateContact", () => {
  it("accepts a valid body", () => {
    expect(
      validateContact({ name: "A", email: "a@b.co", message: "x" }),
    ).toBeNull();
  });

  it("rejects non-object bodies and long messages", () => {
    expect(validateContact(null)).toBeTruthy();
    expect(
      validateContact({ name: "A", email: "a@b.co", message: "x".repeat(5001) }),
    ).toBeTruthy();
  });
});

describe("GET /api/bookings/link", () => {
  it("returns the Altegio booking url", async () => {
    const res = await request(app).get("/api/bookings/link");
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^https:\/\/n\w+\.alteg\.io$/);
  });
});

describe("POST /api/bookings", () => {
  it("logs a booking request", async () => {
    query.mockResolvedValue({ rows: [{ id: 7, status: "pending" }] });
    const res = await request(app).post("/api/bookings").send({
      service: "Facial",
      customerName: "Anna",
      customerPhone: "+49123456789",
    });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 7, status: "pending" });
  });

  it("requires customer name and phone", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ service: "Facial" });
    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});
