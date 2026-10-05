// node --test monitor/check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, HOME_MARKER } from "./check.mjs";

const healthy = {
  home: { status: 200, body: `<h1>${HOME_MARKER}</h1>` },
  sitemap: { status: 200, body: '<?xml version="1.0"?><urlset></urlset>' },
  health: {
    status: 200,
    body: JSON.stringify({ status: "ok", notifications: { telegram: "ok", mail: "ok" } }),
  },
  certDaysLeft: 60,
};
const required = ["telegram", "mail"];
const run = (overrides, req = required) => evaluate("elcorix.de", { ...healthy, ...overrides }, req);
const health = (body, status = 200) => ({ health: { status, body: JSON.stringify(body) } });

test("a healthy site has no problems", () => {
  assert.deepEqual(run({}), { problems: [], warnings: [] });
});

test("a down or broken home page is a problem", () => {
  assert.match(run({ home: { error: "ECONNREFUSED" } }).problems[0], /ECONNREFUSED/);
  assert.match(run({ home: { status: 502, body: "" } }).problems[0], /HTTP 502/);
  // nginx answering 200 with an empty shell is not a working site.
  assert.match(run({ home: { status: 200, body: '<div id="root"></div>' } }).problems[0], /has no/);
});

test("a missing sitemap is a problem", () => {
  assert.match(run({ sitemap: { status: 404, body: "" } }).problems[0], /sitemap/);
});

test("a degraded API is a problem", () => {
  const { problems } = run(health({ status: "degraded", notifications: {} }, 503));
  assert.match(problems[0], /HTTP 503, status "degraded"/);
  assert.match(run({ health: { status: 502, body: "<html>" } }).problems[0], /not JSON/);
});

test("a failing notification channel is a problem, even an optional one", () => {
  const { problems } = run(health({ status: "ok", notifications: { telegram: "failing", mail: "ok" } }), []);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /telegram notifications are FAILING/);
});

test("a required channel must be configured", () => {
  const body = { status: "ok", notifications: { telegram: "ok", mail: "disabled" } };
  assert.match(run(health(body)).problems[0], /mail notifications are "disabled"/);
  assert.deepEqual(run(health(body), ["telegram"]).problems, []);
});

test("a channel still pending after a restart is not an alarm", () => {
  const body = { status: "ok", notifications: { telegram: "pending", mail: "pending" } };
  assert.deepEqual(run(health(body)).problems, []);
});

test("a server from before the notifications field only warns", () => {
  const result = run(health({ status: "ok" }));
  assert.deepEqual(result.problems, []);
  assert.match(result.warnings[0], /no notification status/);
});

test("a certificate close to expiry or invalid is a problem", () => {
  assert.match(run({ certDaysLeft: 13.2 }).problems[0], /expires in 13 days/);
  assert.match(run({ certDaysLeft: "CERT_HAS_EXPIRED" }).problems[0], /CERT_HAS_EXPIRED/);
  assert.deepEqual(run({ certDaysLeft: 14 }).problems, []);
});
