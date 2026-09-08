import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMailerFromEnv,
  disabledMailer,
  sendInBackground,
  type Mailer,
} from "../mailer.js";

const sendMail = vi.fn();

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

const { default: nodemailer } = await import("nodemailer");
const createTransport = nodemailer.createTransport as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  sendMail.mockReset().mockResolvedValue(undefined);
  createTransport.mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const fullEnv = {
  SMTP_HOST: "smtp.example.com",
  MAIL_FROM: "studio@elcorix.com",
  MAIL_TO: "team@elcorix.com",
} as NodeJS.ProcessEnv;

describe("createMailerFromEnv", () => {
  it("is enabled and reports the notify address when fully configured", () => {
    const mailer = createMailerFromEnv(fullEnv);
    expect(mailer.enabled).toBe(true);
    expect(mailer.notifyAddress).toBe("team@elcorix.com");
  });

  it.each([
    ["nothing set", {}],
    ["only SMTP_HOST", { SMTP_HOST: "smtp.example.com" }],
    ["missing MAIL_TO", { SMTP_HOST: "smtp.example.com", MAIL_FROM: "a@b.co" }],
    ["missing MAIL_FROM", { SMTP_HOST: "smtp.example.com", MAIL_TO: "a@b.co" }],
    ["missing SMTP_HOST", { MAIL_FROM: "a@b.co", MAIL_TO: "c@d.co" }],
  ])("returns the disabled mailer when %s", (_label, env) => {
    const mailer = createMailerFromEnv(env as NodeJS.ProcessEnv);
    expect(mailer.enabled).toBe(false);
    expect(mailer.notifyAddress).toBeNull();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("warns about a half-finished configuration but stays silent about none at all", () => {
    const warn = vi.spyOn(console, "warn");
    createMailerFromEnv({} as NodeJS.ProcessEnv);
    expect(warn).not.toHaveBeenCalled();

    createMailerFromEnv({ SMTP_HOST: "smtp.example.com" } as NodeJS.ProcessEnv);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("defaults to port 587 without implicit TLS", () => {
    createMailerFromEnv(fullEnv);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false, auth: undefined }),
    );
  });

  it.each([
    ["465 implies TLS", { SMTP_PORT: "465" }, true],
    ["SMTP_SECURE forces TLS on any port", { SMTP_PORT: "2525", SMTP_SECURE: "true" }, true],
    ["587 stays STARTTLS", { SMTP_PORT: "587" }, false],
  ])("%s", (_label, extra, secure) => {
    createMailerFromEnv({ ...fullEnv, ...extra } as NodeJS.ProcessEnv);
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure }));
  });

  it("passes credentials only when a user is configured", () => {
    createMailerFromEnv({ ...fullEnv, SMTP_USER: "bot", SMTP_PASS: "hunter2" });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: { user: "bot", pass: "hunter2" } }),
    );
  });

  it("sends from MAIL_FROM and lets the message keep its own fields", async () => {
    const mailer = createMailerFromEnv(fullEnv);
    await mailer.send({ to: "guest@example.com", subject: "Hi", text: "Body", replyTo: "guest@example.com" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "studio@elcorix.com",
      to: "guest@example.com",
      subject: "Hi",
      text: "Body",
      replyTo: "guest@example.com",
    });
  });
});

describe("disabledMailer", () => {
  it("accepts a send and does nothing", async () => {
    await expect(disabledMailer.send({ to: "a@b.co", subject: "s", text: "t" })).resolves
      .toBeUndefined();
  });
});

describe("sendInBackground", () => {
  const message = { to: "a@b.co", subject: "Subject", text: "t" };

  it("does not call a disabled mailer at all", () => {
    const send = vi.fn();
    sendInBackground({ enabled: false, notifyAddress: null, send }, message);
    expect(send).not.toHaveBeenCalled();
  });

  it("swallows a rejected send and logs it", async () => {
    const error = vi.spyOn(console, "error");
    const mailer: Mailer = {
      enabled: true,
      notifyAddress: "team@elcorix.com",
      send: vi.fn().mockRejectedValue(new Error("smtp down")),
    };
    expect(() => sendInBackground(mailer, message)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("Subject"),
      expect.any(Error),
    );
  });

  it("swallows a mailer that throws synchronously", () => {
    // This is the case that used to unwind into the route handler and turn
    // an already-answered request into ERR_HTTP_HEADERS_SENT.
    const error = vi.spyOn(console, "error");
    const mailer = {
      enabled: true,
      notifyAddress: "team@elcorix.com",
      send: vi.fn(() => {
        throw new Error("transport exploded");
      }),
    } as unknown as Mailer;
    expect(() => sendInBackground(mailer, message)).not.toThrow();
    expect(error).toHaveBeenCalled();
  });
});
