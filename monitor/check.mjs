// External monitor for the live site, run hourly by
// .github/workflows/monitor.yml — off the Hetzner host, so it still
// alerts when the whole server is down. Plain Node 22: no install step.
//
//   node monitor/check.mjs                      # all three domains
//   MONITOR_DOMAINS=elcorix.de node monitor/check.mjs
//
// Exit code 1 with one line per problem when anything is wrong; GitHub
// e-mails the failed run.
import tls from "node:tls";

/** Text that only renders when the German home page really rendered. */
export const HOME_MARKER = "Dauerhafte Laser-Haarentfernung in Kempten";
export const MIN_CERT_DAYS = 14;

/**
 * Turns what was fetched into a list of problems — pure, so
 * monitor/check.test.mjs can cover every rule without a network.
 *
 * `required` lists the notification channels that must be "ok". "pending"
 * (a server that started seconds ago) is tolerated; a health answer with no
 * `notifications` at all is a server from before the field existed and
 * only warns.
 */
export function evaluate(domain, { home, sitemap, health, certDaysLeft }, required) {
  const problems = [];
  const warnings = [];

  if (home.error) problems.push(`${domain}/de: ${home.error}`);
  else if (home.status !== 200) problems.push(`${domain}/de: HTTP ${home.status}`);
  else if (!home.body.includes(HOME_MARKER)) problems.push(`${domain}/de: page has no "${HOME_MARKER}"`);

  if (sitemap.error) problems.push(`${domain}/sitemap.xml: ${sitemap.error}`);
  else if (sitemap.status !== 200 || !sitemap.body.includes("<urlset")) {
    problems.push(`${domain}/sitemap.xml: HTTP ${sitemap.status}, not a sitemap`);
  }

  if (health.error) problems.push(`${domain}/api/health: ${health.error}`);
  else {
    let data = null;
    try {
      data = JSON.parse(health.body);
    } catch {
      problems.push(`${domain}/api/health: HTTP ${health.status}, not JSON`);
    }
    if (data !== null) {
      if (health.status !== 200 || data.status !== "ok") {
        problems.push(`${domain}/api/health: HTTP ${health.status}, status "${data.status}"`);
      }
      if (data.notifications === undefined) {
        warnings.push(`${domain}/api/health: no notification status (server not redeployed yet?)`);
      } else {
        for (const [channel, state] of Object.entries(data.notifications)) {
          if (state === "failing") {
            problems.push(`${domain}: ${channel} notifications are FAILING — see \`docker compose logs server\``);
          } else if (required.includes(channel) && state !== "ok" && state !== "pending") {
            problems.push(`${domain}: ${channel} notifications are "${state}", expected "ok"`);
          }
        }
      }
    }
  }

  if (typeof certDaysLeft === "string") problems.push(`${domain} TLS: ${certDaysLeft}`);
  else if (certDaysLeft < MIN_CERT_DAYS) {
    problems.push(`${domain} TLS: certificate expires in ${Math.floor(certDaysLeft)} days`);
  }

  return { problems, warnings };
}

async function get(url) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "elcorix-monitor (GitHub Actions)" },
    });
    return { status: response.status, body: await response.text() };
  } catch (err) {
    return { error: err.cause?.code ?? err.message };
  }
}

function certDaysLeft(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: 20_000 }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000);
    });
    // An invalid or expired certificate fails the handshake itself.
    socket.on("error", (err) => resolve(err.code ?? err.message));
    socket.on("timeout", () => {
      socket.destroy();
      resolve("handshake timed out");
    });
  });
}

export async function checkDomain(domain, required) {
  const base = `https://${domain}`;
  const [home, sitemap, health, days] = await Promise.all([
    get(`${base}/de`),
    get(`${base}/sitemap.xml`),
    get(`${base}/api/health`),
    certDaysLeft(domain),
  ]);
  return evaluate(domain, { home, sitemap, health, certDaysLeft: days }, required);
}

const list = (value, fallback) =>
  (value ?? fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

if (import.meta.url === `file://${process.argv[1]}`) {
  const domains = list(process.env.MONITOR_DOMAINS, "elcorix.de,elcorix.com,elcorix.eu");
  const required = list(process.env.MONITOR_REQUIRED_CHANNELS, "telegram,mail");
  const results = await Promise.all(domains.map((domain) => checkDomain(domain, required)));
  const problems = results.flatMap((r) => r.problems);
  for (const warning of results.flatMap((r) => r.warnings)) console.log(`::warning::${warning}`);
  for (const problem of problems) console.log(`::error::${problem}`);
  if (problems.length > 0) process.exit(1);
  console.log(`ok: ${domains.join(", ")}`);
}
