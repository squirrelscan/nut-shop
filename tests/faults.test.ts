import { describe, expect, test } from "bun:test";
import { FAULTS, type FaultId } from "../faults/registry";
import { withFaults, withFaultsAsync } from "../faults/runtime";
import { url } from "#/config/site";
import { STATIC_PAGES } from "#/content/pages";
import { bigSvg, faultRoute } from "#/server/fault-routes";
import { finalize, securityHeaders } from "#/server/headers";
import { htmlLang } from "#/lib/html";
import { categoryHead, homeHead, noindexHead, postHead, productHead, staticHead } from "#/seo/head";
import { robotsTxt, sitemapXml } from "#/seo/sitemap";
import {
  PROXIED_SCRIPT_PATH,
  THIRD_PARTY_GROUPS,
  thirdPartyLoads,
  thirdPartyScriptOrigins,
} from "#/seo/third-party-faults";
import { fakeSecretKey, fakeTokenValue } from "#/seo/fake-secret";
import { fakeAccountPassword, fakeApiKey, fakeDbPassword, probeRoute } from "#/seo/fake-probe-data";
import {
  canonicalOf,
  category,
  ldGraph,
  metaContent,
  pages,
  post,
  product,
  titleOf,
} from "./helpers";

const cartHead = () => {
  const head = noindexHead("Your cart: demo basket", "/cart");
  return JSON.stringify([head.links, head.scripts]);
};

type Probe = { render: () => string; on: (out: string) => boolean };
const has = (needle: string | RegExp) => (out: string) =>
  typeof needle === "string" ? out.includes(needle) : needle.test(out);
const lacks = (needle: string | RegExp) => (out: string) => !has(needle)(out);
const imgTag = (out: string, file: string) =>
  out.match(new RegExp(`<img[^>]*${file}[^>]*>`))?.[0] ?? "";
const json = (v: unknown) => JSON.stringify(v);

/** One probe per fault. `Record<FaultId, ...>` makes a new fault without a probe a type error. */
const probes: Record<FaultId, Probe> = {
  "broken-internal-link": {
    render: () => pages.product("raw-almonds"),
    on: (html: string) => html.includes("/products/almond-brittle-deluxe") && html.includes("/products/pecan-praline-gone"),
  },
  "broken-link-gone-410": {
    render: () => pages.staticPage("about"),
    on: has(`${url("/_fault/gone")}`),
  },
  "broken-external-invalid-domain": {
    render: () => pages.staticPage("contact"),
    on: has("https://nut-supplier.invalid/"),
  },
  "broken-external-404": {
    render: () => pages.staticPage("privacy"),
    on: has("https://squirrelscan.com/nutshop-fault-missing-page"),
  },
  "broken-external-dead-domain": {
    render: () => pages.staticPage("terms"),
    on: has("https://gone.nutshop-fault.squirrelscan.com/"),
  },
  "server-error-page": {
    render: () => pages.staticPage("terms"),
    on: has('href="/_fault/server-error"'),
  },
  "redirect-chain-3-hops": { render: () => pages.home(), on: has('href="/_fault/r1"') },
  "orphan-gift-guide": { render: () => pages.footer(), on: lacks("/gift-guide") },
  "soft-404": { render: () => pages.staticPage("shipping"), on: has("/_fault/soft-404") },
  "sitemap-lists-404": {
    render: () => sitemapXml(),
    on: has("/products/discontinued-almond-brittle"),
  },
  "sitemap-missing-page": { render: () => sitemapXml(), on: lacks("/products/pecan-pieces") },
  "robots-disallow-all": { render: () => robotsTxt(), on: has("Disallow: /\n") },
  "image-missing-alt": {
    render: () => imgTag(pages.product("raw-almonds"), "raw-almonds.svg"),
    on: lacks("alt="),
  },
  "image-missing-dimensions": {
    render: () => imgTag(pages.product("raw-cashews"), "raw-cashews.svg"),
    on: lacks("width="),
  },
  "image-oversized": { render: () => pages.home(), on: has("/_fault/big-image.svg") },
  "mixed-content-image": {
    render: () => pages.product("smooth-peanut-butter"),
    on: has(/src="http:\/\//),
  },
  "meta-description-missing-category": {
    render: () => json(categoryHead(category("raw-nuts")).meta),
    on: lacks('"name":"description"'),
  },
  "title-duplicate": {
    render: () =>
      `${titleOf(productHead(product("raw-almonds")))}||${titleOf(productHead(product("dry-roasted-almonds")))}`,
    on: (o) => o.split("||")[0] === o.split("||")[1],
  },
  "canonical-missing": {
    render: () => String(canonicalOf(productHead(product("raw-cashews")))),
    on: has("undefined"),
  },
  "canonical-wrong-home": {
    render: () => String(canonicalOf(productHead(product("raw-walnut-halves")))),
    on: (o) => o === url("/"),
  },
  "noindex-product": {
    render: () => String(metaContent(productHead(product("raw-pecan-halves")), "name", "robots")),
    on: has("noindex"),
  },
  "h1-missing": { render: () => pages.staticPage("about"), on: lacks("<h1") },
  "h1-duplicate": {
    render: () => pages.staticPage("shipping"),
    on: (o) => (o.match(/<h1[ >]/g) ?? []).length === 2,
  },
  "thin-content-page": {
    render: () =>
      String(
        pages
          .post("storing-nuts-so-they-stay-fresh")
          .replace(/<[^>]+>/g, " ")
          .split(/\s+/).length,
      ),
    on: (o) => Number(o) < 700,
  },
  "jsonld-product-invalid": {
    render: () =>
      json(
        ldGraph(productHead(product("smooth-peanut-butter"))).find((n) => n["@type"] === "Product"),
      ),
    on: lacks('"price"'),
  },
  "jsonld-id-conflict": {
    render: () => {
      const g = ldGraph(staticHead(STATIC_PAGES.about));
      const ids = g.map((n) => n["@id"]);
      return String(ids.length !== new Set(ids).size);
    },
    on: has("true"),
  },
  "csp-removed": {
    render: () => json(Object.keys(securityHeaders())),
    on: lacks("Content-Security-Policy"),
  },
  "xfo-removed": {
    render: () => json(Object.keys(securityHeaders())),
    on: (o) => !o.includes("X-Frame-Options") && o.includes("Strict-Transport-Security"),
  },
  "template-meta-description-missing": {
    render: () =>
      json(
        ["raw-almonds", "smooth-peanut-butter", "big-nut-hamper"].map(
          (s) => productHead(product(s)).meta,
        ),
      ),
    on: lacks('"name":"description"'),
  },
  "footer-broken-link": { render: () => pages.footer(), on: has('href="/gift-guide-2026"') },
  "third-party-script-on-cart": {
    render: () => json(noindexHead("Your cart: demo basket", "/cart").scripts),
    on: has("https://cdn.jsdelivr.net/npm/is-number@7.0.0/index.js"),
  },
  "inline-script-with-token": {
    render: () => json(staticHead(STATIC_PAGES.contact).scripts),
    on: has(fakeTokenValue()),
  },
  "title-too-long": {
    render: () => String(titleOf(productHead(product("classic-trail-mix")))),
    on: (o) => o.length > 70,
  },
  "missing-og-image-post": {
    render: () => json(postHead(post("are-peanuts-really-nuts")).meta),
    on: lacks("og:image"),
  },
  "canonical-wrong-home-same-page": {
    render: () => String(canonicalOf(productHead(product("raw-pecan-halves")))),
    on: (o) => o === url("/"),
  },
  "no-cache-validators": {
    render: () => "sync-placeholder",
    on: () => true, // asserted asynchronously below
  },
  "slow-blocking-script": { render: () => json(homeHead().scripts), on: has("/_fault/slow.js") },
  "html-lang-missing": { render: () => String(htmlLang()), on: has("undefined") },
  "low-contrast-text": {
    render: () => pages.home(),
    on: (html: string) => html.includes("color:#b9b9b9") && html.includes("background-color:#fbf4e6"),
  },
  "leaked-secret-fake": {
    render: () => json(productHead(product("crunchy-peanut-butter")).scripts),
    on: has(fakeSecretKey()),
  },
  "form-input-no-label": { render: () => pages.footer(), on: lacks('for="newsletter-email"') },
  "exposed-env-file": {
    render: () => String(probeRoute(new Request("http://127.0.0.1:4210/.env"))?.status ?? 404),
    on: has("200"),
  },
  "open-users-api": { render: () => pages.staticPage("about"), on: has('fetch("/api/users")') },
  "json-password-field": {
    render: () => pages.staticPage("about"),
    on: has('fetch("/api/account")'),
  },
  "third-party-session-replay-on-cart": {
    render: cartHead,
    on: has("https://edge.fullstory.com/"),
  },
  "third-party-tag-managers-on-cart": { render: cartHead, on: has("https://assets.adobedtm.com/") },
  "third-party-ab-test-on-cart": { render: cartHead, on: has("https://cdn.optimizely.com/js/") },
  "third-party-ad-and-tracking-vendors-on-cart": {
    render: cartHead,
    on: has('"rel":"preload","as":"script","href":"https://c.amazon-adsystem.com/'),
  },
  "third-party-vulnerable-libraries-on-cart": {
    render: cartHead,
    on: has("https://code.jquery.com/jquery-1.11.3.min.js"),
  },
  "third-party-conflicting-library-versions-on-cart": {
    render: cartHead,
    on: has("https://cdn.jsdelivr.net/npm/jquery@3.7.1/"),
  },
  "third-party-vendor-sprawl-home": {
    render: () => json(homeHead().scripts),
    on: has("https://connect.facebook.net/en_US/fbevents.js"),
  },
  "third-party-proxied-script-home": {
    render: () => json(homeHead().scripts),
    on: has(`${PROXIED_SCRIPT_PATH}?url=https%3A%2F%2Fplausible.io%2F`),
  },
  "third-party-unknown-host-script-home": {
    render: () => json(homeHead().scripts),
    on: has('"src":"https://esm.sh/is-number@7.0.0"'),
  },
  "third-party-reported-compromised-vendor-home": {
    render: () => json(homeHead().links),
    on: has('"rel":"preload","as":"script","href":"https://cdn.debugbear.com/'),
  },
  "third-party-new-vendor-home": {
    render: () => json(homeHead().links),
    on: has('"rel":"preload","as":"script","href":"https://snap.licdn.com/'),
  },
};

describe("every fault changes the output it claims to", () => {
  for (const f of FAULTS) {
    if (f.id === "no-cache-validators") continue;
    test(f.id, () => {
      const probe = probes[f.id];
      const off = withFaults([], probe.render);
      const on = withFaults([f.id], probe.render);
      expect(on).not.toBe(off);
      expect(probe.on(on)).toBe(true);
      expect(probe.on(off)).toBe(false);
    });
  }

  test("no-cache-validators: HTML loses ETag and gets no-store", async () => {
    const req = () => new Request("http://127.0.0.1:4210/about");
    const res = () =>
      new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } });
    const off = await withFaultsAsync([], () => finalize(req(), res(), "x"));
    const on = await withFaultsAsync(["no-cache-validators"], () => finalize(req(), res(), "x"));
    expect(off.headers.get("etag")).toBeTruthy();
    expect(off.headers.get("cache-control")).toContain("must-revalidate");
    expect(on.headers.get("etag")).toBeNull();
    expect(on.headers.get("cache-control")).toBe("no-store");
  });

  test("registry is consistent: unique ids, 20+ faults, probes for all", () => {
    const ids = FAULTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(20);
    expect(Object.keys(probes).sort()).toEqual([...ids].sort());
    for (const f of FAULTS) expect(f.confidence).toBe("expected, to be confirmed by audit");
  });
});

describe("fault endpoints (exist in every state)", () => {
  const call = async (p: string) => (await faultRoute(new Request(`http://127.0.0.1:4210${p}`)))!;
  test("/_fault/gone is 410", async () => expect((await call("/_fault/gone")).status).toBe(410));
  test("redirect chain has exactly 3 hops to a 200 page", async () => {
    let path = "/_fault/r1";
    let hops = 0;
    while (path.startsWith("/_fault/")) {
      const r = await call(path);
      expect(r.status).toBe(301);
      path = r.headers.get("location")!;
      hops++;
    }
    expect(hops).toBe(3);
    expect(path).toBe("/categories/gift-boxes");
  });
  test("/_fault/server-error is 500 HTML", async () => {
    const r = await call("/_fault/server-error");
    expect(r.status).toBe(500);
    expect(r.headers.get("content-type")).toContain("text/html");
  });
  test("soft 404 returns 200 with not-found text", async () => {
    const r = await call("/_fault/soft-404");
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Page not found");
  });
  test("big image is over 2 MB", () => expect(bigSvg().length).toBeGreaterThan(2_000_000));
  test("slow script is delayed (promise, not immediate)", () => {
    const r = faultRoute(new Request("http://127.0.0.1:4210/_fault/slow.js"));
    expect(r instanceof Promise).toBe(true);
  });
});

describe("leaked-secret-fake", () => {
  const call = async (p: string) => (await faultRoute(new Request(`http://127.0.0.1:4210${p}`)))!;
  test("asset serves the value only while the fault is on", async () => {
    const off = await withFaultsAsync([], () => call("/_fault/shop-config.js"));
    const on = await withFaultsAsync(["leaked-secret-fake"], () => call("/_fault/shop-config.js"));
    expect(off.status).toBe(404);
    expect(await off.text()).not.toContain(fakeSecretKey());
    expect(on.status).toBe(200);
    expect(await on.text()).toContain(fakeSecretKey());
  });

  test("only the crunchy peanut butter page carries it", () => {
    withFaults(["leaked-secret-fake"], () => {
      expect(json(productHead(product("smooth-peanut-butter")).scripts)).not.toContain(
        fakeSecretKey(),
      );
    });
  });

  test("the key has the provider shape the rule matches", () => {
    expect(fakeSecretKey()).toMatch(/^sk_live_[0-9a-zA-Z]{24}$/);
  });

  test("no contiguous copy of the value in the repository", () => {
    const key = fakeSecretKey();
    for (const needle of [key, key.slice(0, 20), key.slice(8)]) {
      const r = Bun.spawnSync(["git", "grep", "--untracked", "-nF", "-e", needle]);
      expect(r.stdout.toString(), needle).toBe("");
    }
  });
});

describe("probe faults (exposed-env-file, open-users-api, json-password-field)", () => {
  const get = (p: string) => probeRoute(new Request(`http://127.0.0.1:4210${p}`));
  const cases = [
    ["exposed-env-file", "/.env", "text/plain"],
    ["open-users-api", "/api/users", "application/json"],
    ["json-password-field", "/api/account", "application/json"],
  ] as const;
  for (const [id, path, type] of cases) {
    test(`${path} answers only while ${id} is on`, async () => {
      expect(withFaults([], () => get(path))).toBeNull();
      const on = withFaults([id], () => get(path))!;
      expect(on.status).toBe(200);
      expect(on.headers.get("content-type")).toContain(type);
      expect(withFaults([id], () => get("/.env-nope"))).toBeNull();
    });
  }
  test("each toggle switches only its own endpoint", () => {
    expect(withFaults(["open-users-api"], () => get("/api/account"))).toBeNull();
    expect(withFaults(["json-password-field"], () => get("/.env"))).toBeNull();
    expect(withFaults(["exposed-env-file"], () => get("/api/users"))).toBeNull();
  });
  test("/.env is KEY=VALUE lines with secret-looking names", async () => {
    const text = await withFaults(["exposed-env-file"], () => get("/.env"))!.text();
    const lines = text.split("\n").filter(Boolean);
    for (const l of lines) expect(l).toMatch(/^[A-Z][A-Z0-9_]*=\S+$/);
    expect(text).toContain(`DB_PASSWORD=${fakeDbPassword()}`);
  });
  test("/api/users lists fake people at example.com only", async () => {
    const body = (await withFaults(["open-users-api"], () => get("/api/users"))!.json()) as {
      users: { email: string }[];
    };
    expect(body.users.length).toBeGreaterThanOrEqual(5);
    for (const u of body.users) expect(u.email).toMatch(/@example\.com$/);
  });
  test("/api/account carries a password field", async () => {
    const body = (await withFaults(["json-password-field"], () => get("/api/account"))!.json()) as {
      password: string;
    };
    expect(body.password).toBe(fakeAccountPassword());
  });
  test("about page has no call sites with every probe fault off", () => {
    expect(withFaults([], () => pages.staticPage("about"))).not.toContain("__shopApi");
  });
  test("no contiguous copy of the dummy values in the repository", () => {
    for (const v of [fakeDbPassword(), fakeApiKey(), fakeAccountPassword()]) {
      const r = Bun.spawnSync(["git", "grep", "--untracked", "-nF", "-e", v]);
      expect(r.stdout.toString(), v).toBe("");
    }
  });
});

describe("third-party script faults", () => {
  const ids = THIRD_PARTY_GROUPS.map((g) => g.id);
  const scriptSrc = (path: string) =>
    securityHeaders(path)
      ["Content-Security-Policy"]!.split("; ")
      .find((d) => d.startsWith("script-src "))!;

  test("baseline: no third-party load and an unchanged CSP on every page", () => {
    withFaults([], () => {
      for (const path of ["/", "/cart", "/about"]) {
        expect(thirdPartyLoads(path)).toEqual([]);
        expect(thirdPartyScriptOrigins(path)).toEqual([]);
      }
      expect(scriptSrc("/cart")).toBe(scriptSrc("/about"));
    });
  });

  test("a fault loads only on its own page, and the CSP allows exactly its origins there", () => {
    for (const group of THIRD_PARTY_GROUPS) {
      withFaults([group.id], () => {
        const other = group.path === "/" ? "/cart" : "/";
        expect(thirdPartyLoads(other)).toEqual([]);
        expect(scriptSrc(other)).not.toMatch(/hotjar|jquery|facebook|debugbear|esm\.sh/);
        const csp = scriptSrc(group.path);
        for (const load of group.loads) {
          if (load.src.startsWith("/")) continue;
          expect(csp.split(" ")).toContain(new URL(load.src).origin);
        }
      });
    }
  });

  test("only script-src changes: connect-src, img-src and default-src stay as in the baseline", () => {
    const rest = (csp: string) =>
      csp
        .split("; ")
        .filter((d) => !d.startsWith("script-src "))
        .join("; ");
    const off = withFaults([], () => securityHeaders("/")["Content-Security-Policy"]!);
    const on = withFaults(ids, () => securityHeaders("/")["Content-Security-Policy"]!);
    expect(on).not.toBe(off);
    expect(rest(on)).toBe(rest(off));
  });

  test("the existing jsDelivr cart fault is allowed by the cart CSP while it is on", () => {
    expect(withFaults([], () => scriptSrc("/cart"))).not.toContain("https://cdn.jsdelivr.net");
    expect(withFaults(["third-party-script-on-cart"], () => scriptSrc("/cart"))).toContain(
      "https://cdn.jsdelivr.net",
    );
  });

  test("every third-party URL is https on a vendor host, or the first-party proxy path", () => {
    for (const group of THIRD_PARTY_GROUPS) {
      for (const load of group.loads) {
        expect(load.src.startsWith("https://") || load.src.startsWith(PROXIED_SCRIPT_PATH)).toBe(
          true,
        );
      }
    }
  });

  test("a URL two faults share is loaded once", () => {
    withFaults(
      [
        "third-party-vulnerable-libraries-on-cart",
        "third-party-conflicting-library-versions-on-cart",
      ],
      () => {
        const srcs = thirdPartyLoads("/cart").map((l) => l.src);
        expect(new Set(srcs).size).toBe(srcs.length);
        expect(srcs.filter((u) => u.includes("jquery")).length).toBe(2);
      },
    );
  });

  test("the home page fault reaches more than 25 distinct script hosts", () => {
    const hosts = new Set(
      THIRD_PARTY_GROUPS.find((g) => g.id === "third-party-vendor-sprawl-home")!.loads.map(
        (l) => new URL(l.src).hostname,
      ),
    );
    expect(hosts.size).toBeGreaterThan(25);
  });

  test("the proxy stand-in is first-party JavaScript", async () => {
    const r = (await faultRoute(
      new Request(
        `http://127.0.0.1:4210${PROXIED_SCRIPT_PATH}?url=https%3A%2F%2Fplausible.io%2Fjs%2Fscript.js`,
      ),
    ))!;
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/javascript");
  });
});
