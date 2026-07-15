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
  it("returns ok when the database answers", async () => {
    query.mockResolvedValue({ rows: [] });
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns 503 degraded when the database is down", async () => {
    query.mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded" });
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

  it("silently drops honeypot submissions without storing them", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...valid, website: "https://spam.example.com" });
    expect(res.status).toBe(201);
    expect(query).not.toHaveBeenCalled();
  });

  it("notifies staff and confirms to the customer when SMTP is configured", async () => {
    query.mockResolvedValue({ rows: [{ id: 42, created_at: new Date() }] });
    const send = vi.fn().mockResolvedValue(undefined);
    const mailApp = createApp(db, {
      mailer: { enabled: true, notifyAddress: "owner@example.com", send },
    });
    const res = await request(mailApp)
      .post("/api/contact")
      .send({ ...valid, lang: "en" });
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        replyTo: "anna@example.com",
        subject: expect.stringContaining("Anna"),
      }),
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "anna@example.com",
        subject: expect.stringContaining("We received your message"),
      }),
    );
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

  it("silently drops honeypot submissions without storing them", async () => {
    const res = await request(app).post("/api/bookings").send({
      customerName: "Bot",
      customerPhone: "+49123456789",
      website: "spam",
    });
    expect(res.status).toBe(201);
    expect(query).not.toHaveBeenCalled();
  });

  it("notifies staff when SMTP is configured", async () => {
    query.mockResolvedValue({ rows: [{ id: 7, status: "pending" }] });
    const send = vi.fn().mockResolvedValue(undefined);
    const mailApp = createApp(db, {
      mailer: { enabled: true, notifyAddress: "owner@example.com", send },
    });
    const res = await request(mailApp).post("/api/bookings").send({
      service: "Facial",
      customerName: "Anna",
      customerPhone: "+49123456789",
    });
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        subject: expect.stringContaining("Anna"),
        text: expect.stringContaining("+49123456789"),
      }),
    );
  });
});
