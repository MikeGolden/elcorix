import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createTelegramFromEnv,
  disabledTelegram,
  BOOKING_NOTIFICATION,
  notifyInBackground,
  type TelegramNotifier,
} from "../telegram.js";

const fullEnv = {
  TELEGRAM_BOT_TOKEN: "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
  TELEGRAM_CHAT_ID: "-1001234567890",
} as NodeJS.ProcessEnv;

function okFetch() {
  return vi.fn().mockResolvedValue(new Response("{\"ok\":true}", { status: 200 }));
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createTelegramFromEnv", () => {
  it("is enabled and reports the chat when fully configured", () => {
    const telegram = createTelegramFromEnv(fullEnv, okFetch());
    expect(telegram.enabled).toBe(true);
    expect(telegram.chatId).toBe("-1001234567890");
  });

  it.each([
    ["nothing set", {}],
    ["only a token", { TELEGRAM_BOT_TOKEN: fullEnv.TELEGRAM_BOT_TOKEN }],
    ["only a chat id", { TELEGRAM_CHAT_ID: "-1001234567890" }],
    ["a token that is not a BotFather token", { ...fullEnv, TELEGRAM_BOT_TOKEN: "hunter2" }],
    ["a chat id that is neither numeric nor @name", { ...fullEnv, TELEGRAM_CHAT_ID: "my chat" }],
    ["a chat id that is a URL", { ...fullEnv, TELEGRAM_CHAT_ID: "https://t.me/elcorix" }],
  ])("is disabled with %s", (_label, env) => {
    const telegram = createTelegramFromEnv(env as NodeJS.ProcessEnv, okFetch());
    expect(telegram.enabled).toBe(false);
    expect(telegram.chatId).toBeNull();
  });

  it("warns about a half-finished configuration but stays silent about none at all", () => {
    const warn = vi.spyOn(console, "warn");
    createTelegramFromEnv({} as NodeJS.ProcessEnv, okFetch());
    expect(warn).not.toHaveBeenCalled();

    createTelegramFromEnv({ TELEGRAM_CHAT_ID: "42" } as NodeJS.ProcessEnv, okFetch());
    expect(warn).toHaveBeenCalledOnce();
  });

  it("never puts the bot token in a warning", () => {
    const warn = vi.spyOn(console, "warn");
    createTelegramFromEnv(
      { ...fullEnv, TELEGRAM_CHAT_ID: "nonsense" } as NodeJS.ProcessEnv,
      okFetch(),
    );
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).not.toContain(fullEnv.TELEGRAM_BOT_TOKEN);
  });

  it("posts the message to the Bot API for the configured chat", async () => {
    const fetchImpl = okFetch();
    await createTelegramFromEnv(fullEnv, fetchImpl).send("<b>Hi</b>");

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://api.telegram.org/bot${fullEnv.TELEGRAM_BOT_TOKEN}/sendMessage`,
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      chat_id: "-1001234567890",
      text: "<b>Hi</b>",
    });
    expect(JSON.parse(String(init.body))).not.toHaveProperty("parse_mode");
  });

  it("truncates to Telegram's 4096-character limit instead of being rejected", async () => {
    const fetchImpl = okFetch();
    await createTelegramFromEnv(fullEnv, fetchImpl).send("x".repeat(5000));
    const body = JSON.parse(String((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.text).toHaveLength(4096);
  });

  it("throws with Telegram's own reason when the API rejects the call", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response('{"ok":false,"description":"chat not found"}', { status: 400 }),
      );
    await expect(createTelegramFromEnv(fullEnv, fetchImpl).send("hi")).rejects.toThrow(
      /chat not found/,
    );
  });

  it("keeps the bot token out of the error it throws", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 401 }));
    await createTelegramFromEnv(fullEnv, fetchImpl)
      .send("hi")
      .catch((err: Error) => {
        expect(err.message).not.toContain(fullEnv.TELEGRAM_BOT_TOKEN);
        expect(err.message).toContain("401");
      });
    expect.assertions(2);
  });
});

describe("TelegramNotifier.check", () => {
  it("asks the Bot API for the configured chat", async () => {
    const fetchImpl = okFetch();
    await createTelegramFromEnv(fullEnv, fetchImpl).check!();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toMatch(/\/getChat$/);
    expect(JSON.parse(init.body as string)).toEqual({ chat_id: fullEnv.TELEGRAM_CHAT_ID });
  });

  it("fails with Telegram's reason and without the token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response('{"ok":false,"description":"Bad Request: chat not found"}', { status: 400 }),
      );
    const err = await createTelegramFromEnv(fullEnv, fetchImpl)
      .check!()
      .catch((e: Error) => e);
    expect((err as Error).message).toMatch(/getChat failed: HTTP 400 .*chat not found/);
    expect((err as Error).message).not.toContain(fullEnv.TELEGRAM_BOT_TOKEN);
  });

  it("names the new chat id when the group was upgraded to a supergroup", async () => {
    // What Telegram answers for the old basic-group id once the group has
    // been upgraded — every send fails from then on while the site looks fine.
    const migrated = () =>
      new Response(
        JSON.stringify({
          ok: false,
          error_code: 400,
          description: "Bad Request: group chat was upgraded to a supergroup chat",
          parameters: { migrate_to_chat_id: -1009876543210 },
        }),
        { status: 400 },
      );
    const fetchImpl = vi.fn().mockImplementation(async () => migrated());
    const telegram = createTelegramFromEnv(
      { ...fullEnv, TELEGRAM_CHAT_ID: "-5453380295" },
      fetchImpl,
    );
    await expect(telegram.check!()).rejects.toThrow("set TELEGRAM_CHAT_ID=-1009876543210");
    await expect(telegram.send("hi")).rejects.toThrow("set TELEGRAM_CHAT_ID=-1009876543210");
  });
});

describe("disabledTelegram", () => {
  it("accepts a send and does nothing", async () => {
    await expect(disabledTelegram.send("anything")).resolves.toBeUndefined();
  });
});

describe("BOOKING_NOTIFICATION", () => {
  it("carries no personal data, as the privacy policy promises", () => {
    expect(BOOKING_NOTIFICATION).toBe(
      "Neue Anfrage eingegangen – bitte im geschützten System prüfen.",
    );
    // No digits (phone, id, date or time) can hide in a fixed text.
    expect(BOOKING_NOTIFICATION).not.toMatch(/\d/);
  });
});

describe("notifyInBackground", () => {
  it("does not call a disabled notifier at all", () => {
    const send = vi.fn();
    notifyInBackground({ enabled: false, chatId: null, send }, "hi");
    expect(send).not.toHaveBeenCalled();
  });

  it("swallows a rejected send and logs it", async () => {
    const error = vi.spyOn(console, "error");
    const telegram: TelegramNotifier = {
      enabled: true,
      chatId: "42",
      send: vi.fn().mockRejectedValue(new Error("telegram down")),
    };
    expect(() => notifyInBackground(telegram, "hi")).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(error).toHaveBeenCalledWith(expect.any(String), expect.any(Error));
  });

  it("swallows a notifier that throws synchronously", () => {
    // The route has already answered; an exception here would turn a stored
    // request into ERR_HTTP_HEADERS_SENT.
    const error = vi.spyOn(console, "error");
    const telegram = {
      enabled: true,
      chatId: "42",
      send: vi.fn(() => {
        throw new Error("fetch exploded");
      }),
    } as unknown as TelegramNotifier;
    expect(() => notifyInBackground(telegram, "hi")).not.toThrow();
    expect(error).toHaveBeenCalled();
  });
});
