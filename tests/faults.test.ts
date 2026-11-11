import { describe, expect, test } from "bun:test";
import { FAULTS, type FaultId } from "../faults/registry";
import { withFaults, withFaultsAsync } from "../faults/runtime";
import { url } from "#/config/site";
import { STATIC_PAGES } from "#/content/pages";
import { bigSvg, faultRoute } from "#/server/fault-routes";
import { finalize, securityHeaders } from "#/server/headers";
import { htmlLang } from "#/lib/html";
import { categoryHead, homeHead, productHead, staticHead } from "#/seo/head";
import { robotsTxt, sitemapXml } from "#/seo/sitemap";
import { fakeSecretKey } from "#/seo/fake-secret";
import { canonicalOf, category, ldGraph, metaContent, pages, product, titleOf } from "./helpers";

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
    on: has("/products/almond-brittle-deluxe"),
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
  "hsts-xfo-removed": {
    render: () => json(Object.keys(securityHeaders())),
    on: (o) => !o.includes("Strict-Transport-Security") && !o.includes("X-Frame-Options"),
  },
  "no-cache-validators": {
    render: () => "sync-placeholder",
    on: () => true, // asserted asynchronously below
  },
  "slow-blocking-script": { render: () => json(homeHead().scripts), on: has("/_fault/slow.js") },
  "html-lang-missing": { render: () => String(htmlLang()), on: has("undefined") },
  "low-contrast-text": { render: () => pages.home(), on: has("#b9b9b9") },
  "leaked-secret-fake": {
    render: () => json(productHead(product("crunchy-peanut-butter")).scripts),
    on: has(fakeSecretKey()),
  },
  "form-input-no-label": { render: () => pages.footer(), on: lacks('for="newsletter-email"') },
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
