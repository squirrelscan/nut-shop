/**
 * FAKE data for the three probe faults (`exposed-env-file`, `open-users-api`,
 * `json-password-field`). Nothing here is a real credential or a real person:
 * every value was typed at random for squirrelscan's demo store, was never
 * issued by any provider, and must never be tested against any service. The
 * emails use the reserved example.com domain. Secret-looking values are
 * assembled from parts at request time, like `fake-secret.ts`, so no contiguous
 * copy sits in this repository.
 */
import { fault } from "../../faults/runtime";

const DB_PASSWORD_PARTS = ["nutshop", "-demo-", "Hq4Zp8", "Lk2Vw7"] as const;
const API_KEY_PARTS = ["demo_", "key_", "Rb6Tn3", "Xc9Mf5", "Pj1Gs8"] as const;
const ACCOUNT_PASSWORD_PARTS = ["hazel", "nut-", "Wq7Ry2", "Zt5Kb9"] as const;

export const fakeDbPassword = (): string => DB_PASSWORD_PARTS.join("");
export const fakeApiKey = (): string => API_KEY_PARTS.join("");
export const fakeAccountPassword = (): string => ACCOUNT_PASSWORD_PARTS.join("");

/** A dotenv file: KEY=VALUE lines with secret-looking names (what security/exposed-files matches). */
export const fakeDotenv = (): string =>
  [
    "APP_ENV=production",
    "APP_NAME=nutshop",
    "DATABASE_URL=postgres://nutshop:" + fakeDbPassword() + "@db.example.com:5432/shop",
    "DB_PASSWORD=" + fakeDbPassword(),
    "PAYMENTS_API_KEY=" + fakeApiKey(),
    "SESSION_SECRET=" + fakeApiKey().split("").reverse().join(""),
    "",
  ].join("\n");

const PEOPLE = [
  ["Ada", "Hazel"],
  ["Ben", "Walnut"],
  ["Cara", "Pecan"],
  ["Dev", "Almond"],
  ["Eli", "Cashew"],
  ["Fay", "Pistachio"],
] as const;

/** An unauthenticated user list with personal data (fake people at example.com). */
export const fakeUsers = () =>
  PEOPLE.map(([first, last], i) => ({
    id: 1001 + i,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: `+61 400 000 ${String(100 + i).padStart(3, "0")}`,
    role: i === 0 ? "admin" : "customer",
    createdAt: `2026-0${(i % 9) + 1}-1${i}T09:00:00Z`,
  }));

/** One account record that carries a `password` field with a dummy value. */
export const fakeAccount = () => ({
  id: 1001,
  username: "ada.hazel",
  email: "ada.hazel@example.com",
  password: fakeAccountPassword(),
  plan: "demo",
});

export const PROBE_PAGE_PATH = "/about";
export const USERS_API_PATH = "/api/users";
export const ACCOUNT_API_PATH = "/api/account";

const json = (body: unknown): Response =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/** The probe endpoints. Each answers only while its fault is on; otherwise null (the app's 404). */
export function probeRoute(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const { pathname } = new URL(request.url);
  if (pathname === "/.env" && fault("exposed-env-file")) {
    return new Response(fakeDotenv(), {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  if (pathname === USERS_API_PATH && fault("open-users-api")) return json({ users: fakeUsers() });
  if (pathname === ACCOUNT_API_PATH && fault("json-password-field")) return json(fakeAccount());
  return null;
}

/**
 * Inline script for the about page, so squirrelscan's endpoint discovery sees the API call sites
 * (the API rules probe only discovered endpoints, never guessed paths). Body script, not head:
 * the framework drops head scripts after hydration.
 */
export function probeCallSites(): string | null {
  const calls: string[] = [];
  if (fault("open-users-api")) calls.push(`fetch("${USERS_API_PATH}")`);
  if (fault("json-password-field")) calls.push(`fetch("${ACCOUNT_API_PATH}")`);
  if (calls.length === 0) return null;
  return `window.__shopApi = { load: () => Promise.all([${calls.join(", ")}]) };`;
}
