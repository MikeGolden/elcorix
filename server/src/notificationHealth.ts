/**
 * Is anybody actually being told about new requests?
 *
 * Telegram and e-mail notifications are fire-and-forget (see
 * notifyInBackground / sendInBackground): a request is safe in Postgres
 * before either is attempted, so a failed send only logs. That is right for
 * the visitor and wrong for the studio — a revoked bot token, a Telegram
 * group silently upgraded to a supergroup (new chat id) or a changed SMTP
 * password means requests pile up unseen while the site looks fine.
 *
 * `watchChannel` keeps one status word per channel, fed from two sides:
 * a cheap check (Telegram getChat, SMTP verify) at startup and every six
 * hours, and the outcome of every real send. /api/health publishes the
 * words, and the external monitor (.github/workflows/monitor.yml) alerts
 * on "failing". The reason goes to the log only — never into the public
 * health response.
 */

export type ChannelStatus = "disabled" | "pending" | "ok" | "failing";

export interface WatchedChannel {
  readonly status: ChannelStatus;
  /** Runs the check now (no-op for a channel without one). */
  checkNow(): Promise<void>;
  /** Passes a send through, recording whether it succeeded. */
  track<T>(send: Promise<T>): Promise<T>;
  stop(): void;
}

export interface CheckableChannel {
  enabled: boolean;
  /** Proves the channel would deliver, without delivering anything. */
  check?: () => Promise<void>;
}

/** Often enough to notice within a working day, rare enough to be free. */
export const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function watchChannel(
  name: string,
  channel: CheckableChannel,
  { intervalMs = DEFAULT_CHECK_INTERVAL_MS }: { intervalMs?: number } = {},
): WatchedChannel {
  let status: ChannelStatus = channel.enabled ? "pending" : "disabled";
  let timer: ReturnType<typeof setInterval> | undefined;

  // Log transitions, not states: one line when it breaks, one when it
  // recovers — a six-hourly reminder of the same failure is noise.
  function succeeded() {
    if (status === "failing") console.log(`${name} notifications recovered`);
    status = "ok";
  }
  function failed(err: unknown) {
    if (status !== "failing") {
      console.error(`${name} notifications FAILING: ${reasonOf(err)}`);
    }
    status = "failing";
  }

  async function checkNow() {
    if (!channel.enabled || !channel.check) return;
    try {
      await channel.check();
      succeeded();
    } catch (err) {
      failed(err);
    }
  }

  if (channel.enabled && channel.check) {
    void checkNow();
    timer = setInterval(() => void checkNow(), intervalMs);
    // A health probe must never keep the process alive on shutdown.
    timer.unref?.();
  }

  return {
    get status() {
      return status;
    },
    checkNow,
    async track(send) {
      try {
        const result = await send;
        succeeded();
        return result;
      } catch (err) {
        failed(err);
        throw err;
      }
    },
    stop() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    },
  };
}
