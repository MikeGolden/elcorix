import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cleanupExpiredRecords,
  MAX_RETENTION_MONTHS,
  startRetentionCleanup,
} from "../retention.js";
import type { Queryable } from "../db/pool.js";

const query = vi.fn();
const db = { query } as unknown as Queryable;

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ rowCount: 0 });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("cleanupExpiredRecords", () => {
  it("deletes from both tables by age, with the window as a bound parameter", async () => {
    query
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rowCount: 2 });

    const deleted = await cleanupExpiredRecords(db, 12);

    expect(deleted).toEqual({ contacts: 3, bookings: 2 });
    expect(query).toHaveBeenCalledTimes(2);

    const [contactSql, contactParams] = query.mock.calls[0];
    const [bookingSql, bookingParams] = query.mock.calls[1];
    expect(contactSql).toMatch(/DELETE FROM contact_messages/);
    expect(bookingSql).toMatch(/DELETE FROM booking_requests/);
    // The retention window must never be interpolated into the statement.
    for (const sql of [contactSql, bookingSql]) {
      expect(sql).toContain("make_interval(months => $1)");
      expect(sql).not.toContain("12");
    }
    expect(contactParams).toEqual([12]);
    expect(bookingParams).toEqual([12]);
  });

  it("only ever deletes rows older than the window — never a bare DELETE", async () => {
    await cleanupExpiredRecords(db, 1);
    for (const [sql] of query.mock.calls) {
      expect(sql).toMatch(/WHERE\s+created_at\s*</);
    }
  });

  it("reports zero when the driver gives no row count", async () => {
    query.mockResolvedValue({ rowCount: null });
    await expect(cleanupExpiredRecords(db, 12)).resolves.toEqual({
      contacts: 0,
      bookings: 0,
    });
  });

  it("propagates a database failure instead of reporting a successful purge", async () => {
    query.mockRejectedValueOnce(new Error("db down"));
    await expect(cleanupExpiredRecords(db, 12)).rejects.toThrow("db down");
  });
});

describe("startRetentionCleanup", () => {
  it("runs once at startup and then daily, and stops when told to", async () => {
    vi.useFakeTimers();
    vi.stubEnv("RETENTION_MONTHS", "12");

    const stop = startRetentionCleanup(db);
    // The two DELETEs are awaited in sequence, so let the microtasks drain.
    await vi.advanceTimersByTimeAsync(0);
    expect(query).toHaveBeenCalledTimes(2); // one DELETE per table

    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(query).toHaveBeenCalledTimes(4);

    stop();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(query).toHaveBeenCalledTimes(4);
  });

  it.each([["0"], ["-1"], ["1.5"], ["forever"], [""]])(
    "refuses to delete anything when RETENTION_MONTHS is %j",
    (value) => {
      vi.stubEnv("RETENTION_MONTHS", value);
      const stop = startRetentionCleanup(db);
      expect(query).not.toHaveBeenCalled();
      stop();
    },
  );

  it("defaults to the 6-month window of the privacy policy when the variable is unset", () => {
    vi.stubEnv("RETENTION_MONTHS", undefined as unknown as string);
    const stop = startRetentionCleanup(db);
    expect(query.mock.calls[0][1]).toEqual([6]);
    stop();
  });

  it("never keeps requests longer than the privacy policy allows", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("RETENTION_MONTHS", "12");
    const stop = startRetentionCleanup(db);
    expect(query.mock.calls[0][1]).toEqual([MAX_RETENTION_MONTHS]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("exceeds"));
    stop();
  });

  it("accepts a shorter window", () => {
    vi.stubEnv("RETENTION_MONTHS", "3");
    const stop = startRetentionCleanup(db);
    expect(query.mock.calls[0][1]).toEqual([3]);
    stop();
  });

  it("survives a failing cleanup run and keeps the schedule alive", async () => {
    vi.useFakeTimers();
    query.mockRejectedValue(new Error("db down"));

    const stop = startRetentionCleanup(db);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);

    expect(query.mock.calls.length).toBeGreaterThan(1);
    stop();
  });
});
