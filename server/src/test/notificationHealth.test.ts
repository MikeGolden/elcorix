import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { watchChannel } from "../notificationHealth.js";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("watchChannel", () => {
  it("reports a disabled channel as disabled and never checks it", () => {
    const check = vi.fn();
    const channel = watchChannel("Telegram", { enabled: false, check });
    expect(channel.status).toBe("disabled");
    expect(check).not.toHaveBeenCalled();
    channel.stop();
  });

  it("is pending until the first check answers, then ok", async () => {
    let answer!: () => void;
    const check = vi.fn(() => new Promise<void>((resolve) => (answer = resolve)));
    const channel = watchChannel("Telegram", { enabled: true, check });
    expect(channel.status).toBe("pending");
    answer();
    await vi.waitFor(() => expect(channel.status).toBe("ok"));
    channel.stop();
  });

  it("turns failing when the check fails, and logs the reason once", async () => {
    const check = vi.fn().mockRejectedValue(new Error("chat not found"));
    const channel = watchChannel("Telegram", { enabled: true, check });
    await vi.waitFor(() => expect(channel.status).toBe("failing"));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Telegram notifications FAILING: chat not found"),
    );

    // A second failure is not a new incident — no second log line.
    await channel.checkNow();
    expect(console.error).toHaveBeenCalledTimes(1);
    channel.stop();
  });

  it("logs the recovery when a failing channel works again", async () => {
    const check = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValue(undefined);
    const channel = watchChannel("E-mail", { enabled: true, check });
    await vi.waitFor(() => expect(channel.status).toBe("failing"));
    await channel.checkNow();
    expect(channel.status).toBe("ok");
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("E-mail notifications recovered"));
    channel.stop();
  });

  it("re-checks on its interval", async () => {
    vi.useFakeTimers();
    const check = vi.fn().mockResolvedValue(undefined);
    const channel = watchChannel("Telegram", { enabled: true, check }, { intervalMs: 1000 });
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(check).toHaveBeenCalledTimes(4);
    channel.stop();
    await vi.advanceTimersByTimeAsync(3000);
    expect(check).toHaveBeenCalledTimes(4);
  });

  it("lets real sends move the status both ways", async () => {
    const channel = watchChannel("Telegram", { enabled: true });
    expect(channel.status).toBe("pending");

    await expect(channel.track(Promise.reject(new Error("HTTP 400")))).rejects.toThrow("HTTP 400");
    expect(channel.status).toBe("failing");

    await expect(channel.track(Promise.resolve("sent"))).resolves.toBe("sent");
    expect(channel.status).toBe("ok");
    channel.stop();
  });

  it("without a check, a channel stays pending until something is sent", async () => {
    const channel = watchChannel("Telegram", { enabled: true });
    await channel.checkNow();
    expect(channel.status).toBe("pending");
    channel.stop();
  });
});
