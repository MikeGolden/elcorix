import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { validateContact } from "../routes/contact.js";
import type { Queryable } from "../db/pool.js";

const query = vi.fn();
const db = { query } as unknown as Queryable;
// Behaviour tests, not rate-limiting tests: security.test.ts owns the
// limiter, and a shared 30-request budget would otherwise start returning
// 429 to whichever case happens to run last.
const app = createApp(db, { rateLimitMax: 10_000 });

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

  it("confirms in Russian when the client says the visitor is reading /ru", async () => {
    query.mockResolvedValue({ rows: [{ id: 43, created_at: new Date() }] });
    const send = vi.fn().mockResolvedValue(undefined);
    const mailApp = createApp(db, {
      mailer: { enabled: true, notifyAddress: "owner@example.com", send },
    });
    const res = await request(mailApp)
      .post("/api/contact")
      .send({ ...valid, lang: "ru" });
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "anna@example.com",
        subject: expect.stringContaining("Мы получили ваше сообщение"),
      }),
    );
  });

  it("falls back to German for a language the auto-reply has no copy for", async () => {
    query.mockResolvedValue({ rows: [{ id: 44, created_at: new Date() }] });
    const send = vi.fn().mockResolvedValue(undefined);
    const mailApp = createApp(db, {
      mailer: { enabled: true, notifyAddress: "owner@example.com", send },
    });
    await request(mailApp)
      .post("/api/contact")
      .send({ ...valid, lang: "ru-RU" });
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "anna@example.com",
        subject: expect.stringContaining("Wir haben Ihre Nachricht erhalten"),
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

/** A date the retention/past-date rules will still accept next year. */
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

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

  it("stores the preferred date/time and marketing opt-in from the consultation form", async () => {
    query.mockResolvedValue({ rows: [{ id: 8, status: "pending" }] });
    const preferredAt = `${daysFromNow(7)} 10:30`;
    const res = await request(app).post("/api/bookings").send({
      customerName: "Anna",
      customerPhone: "+49123456789",
      preferredAt,
      marketingConsent: true,
    });
    expect(res.status).toBe(201);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("preferred_at"),
      expect.arrayContaining([preferredAt, true]),
    );
  });

  it.each([
    ["a bare time with no day", "14:00"],
    ["a date in the past", "2020-01-02"],
    ["an impossible day", "2030-02-31"],
    ["an impossible hour", "2030-01-02 25:00"],
    ["a free-text wish", "sometime next week"],
    ["a different date format", "15.09.2030"],
    ["an ISO timestamp", "2030-01-02T10:30:00Z"],
  ])("rejects %s as a preferred slot", async (_case, preferredAt) => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789", preferredAt });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/preferredAt/);
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ["a date on its own", () => daysFromNow(3)],
    ["a date and time", () => `${daysFromNow(3)} 09:00"`.replace('"', "")],
    ["today", () => daysFromNow(0)],
    ["an empty string", () => ""],
  ])("accepts %s", async (_case, build) => {
    query.mockResolvedValue({ rows: [{ id: 12, status: "pending" }] });
    const res = await request(app)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789", preferredAt: build() });
    expect(res.status).toBe(201);
  });

  it("stores an empty preferred slot as null rather than an empty string", async () => {
    query.mockResolvedValue({ rows: [{ id: 13, status: "pending" }] });
    await request(app)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789", preferredAt: "   " });
    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([null]),
    );
  });

  it("defaults the marketing opt-in to false and the preferred slot to null", async () => {
    query.mockResolvedValue({ rows: [{ id: 9, status: "pending" }] });
    await request(app)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789" });
    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([null, false]),
    );
  });

  it.each([
    [{ preferredAt: 42 }],
    [{ preferredAt: "x".repeat(41) }],
    [{ marketingConsent: "yes" }],
  ])("rejects an invalid consultation field %#", async (extra) => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789", ...extra });
    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ["letters", "asdfgh"],
    ["too few digits", "12345"],
    ["mixed letters and digits", "+49 abc 123456"],
    ["too many digits", "1".repeat(16)],
  ])("rejects a phone number that is %s", async (_case, customerPhone) => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("customerPhone is invalid");
    expect(query).not.toHaveBeenCalled();
  });

  it.each([["+49 155 625 14 872"], ["0155/6251487"], ["(0049) 155 625-14-872"]])(
    "accepts the phone number %s as visitors write it",
    async (customerPhone) => {
      query.mockResolvedValue({ rows: [{ id: 11, status: "pending" }] });
      const res = await request(app)
        .post("/api/bookings")
        .send({ customerName: "Anna", customerPhone });
      expect(res.status).toBe(201);
    },
  );

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

  it("posts the request to Telegram when the bot is configured", async () => {
    query.mockResolvedValue({ rows: [{ id: 21, status: "pending" }] });
    const send = vi.fn().mockResolvedValue(undefined);
    const botApp = createApp(db, { telegram: { enabled: true, chatId: "-100", send } });
    const res = await request(botApp).post("/api/bookings").send({
      customerName: "Anna",
      customerPhone: "+49123456789",
      preferredAt: `${daysFromNow(3)} 10:30`,
      marketingConsent: true,
    });
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const text = send.mock.calls[0][0] as string;
    expect(text).toContain("Anna");
    expect(text).toContain("+49123456789");
    expect(text).toContain("10:30");
    expect(text).toContain("#21");
  });

  it("notifies both channels for the same request", async () => {
    query.mockResolvedValue({ rows: [{ id: 22, status: "pending" }] });
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const sendChat = vi.fn().mockResolvedValue(undefined);
    const bothApp = createApp(db, {
      mailer: { enabled: true, notifyAddress: "owner@example.com", send: sendMail },
      telegram: { enabled: true, chatId: "-100", send: sendChat },
    });
    await request(bothApp)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789" });
    await vi.waitFor(() => {
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendChat).toHaveBeenCalledTimes(1);
    });
  });

  it("does not post honeypot submissions to Telegram", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const botApp = createApp(db, { telegram: { enabled: true, chatId: "-100", send } });
    const res = await request(botApp).post("/api/bookings").send({
      customerName: "Bot",
      customerPhone: "+49123456789",
      website: "spam",
    });
    expect(res.status).toBe(201);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(send).not.toHaveBeenCalled();
  });

  it("does not post rejected submissions to Telegram", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const botApp = createApp(db, { telegram: { enabled: true, chatId: "-100", send } });
    const res = await request(botApp)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "asdfgh" });
    expect(res.status).toBe(400);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(send).not.toHaveBeenCalled();
  });

  it("still answers 201 when the Telegram send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    query.mockResolvedValue({ rows: [{ id: 23, status: "pending" }] });
    const send = vi.fn().mockRejectedValue(new Error("telegram down"));
    const botApp = createApp(db, { telegram: { enabled: true, chatId: "-100", send } });
    const res = await request(botApp)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789" });
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(send).toHaveBeenCalled());
    vi.restoreAllMocks();
  });

  it("does not post to Telegram when the database insert fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    query.mockRejectedValue(new Error("db down"));
    const send = vi.fn().mockResolvedValue(undefined);
    const botApp = createApp(db, { telegram: { enabled: true, chatId: "-100", send } });
    const res = await request(botApp)
      .post("/api/bookings")
      .send({ customerName: "Anna", customerPhone: "+49123456789" });
    expect(res.status).toBe(500);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(send).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
