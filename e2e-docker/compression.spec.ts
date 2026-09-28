import { test, expect } from "@playwright/test";

/**
 * In production Caddy sits in front of nginx and adds `Via: 1.1 Caddy` to
 * every request. nginx counts any request with a Via header as proxied and,
 * with gzip_proxied at its default (off), then compresses nothing — which
 * is how the site shipped its whole bundle uncompressed. Send the header
 * Caddy sends and check the answer is still gzipped.
 */
test("compresses assets for requests that came through Caddy", async ({ request }) => {
  const html = await (await request.get("/de")).text();
  const script = html.match(/\/assets\/[^"]+\.js/)?.[0];
  expect(script, "the document references a hashed bundle").toBeTruthy();

  const res = await request.get(script!, {
    headers: { Via: "1.1 Caddy", "Accept-Encoding": "gzip" },
  });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-encoding"]).toBe("gzip");
});
