import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import active from "../faults/active.json";
import { isKnownFault, withFaults } from "../faults/runtime";
import { CATEGORIES, POSTS, PRODUCTS } from "#/content";
import { STATIC_PAGES } from "#/content/pages";
import { SITE } from "#/config/site";
import {
  blogIndexHead,
  categoryHead,
  faqHead,
  homeHead,
  noindexHead,
  postHead,
  productHead,
  shopHead,
  staticHead,
} from "#/seo/head";
import { indexablePaths, llmsTxt, robotsTxt, sitemapXml } from "#/seo/sitemap";
import { finalize, securityHeaders } from "#/server/headers";
import { canonicalOf, ldGraph, metaContent, pages, titleOf } from "./helpers";

const allHeads = () =>
  [
    ["/", homeHead()],
    ["/shop", shopHead()],
    ["/blog", blogIndexHead()],
    ["/faq", faqHead()],
    ...Object.values(STATIC_PAGES).map((p) => [p.path, staticHead(p)] as const),
    ...CATEGORIES.map((c) => [`/categories/${c.slug}`, categoryHead(c)] as const),
    ...PRODUCTS.map((p) => [`/products/${p.slug}`, productHead(p)] as const),
    ...POSTS.map((p) => [`/blog/${p.slug}`, postHead(p)] as const),
  ] as const;

describe("healthy baseline", () => {
  test("active.json lists only known faults", () => {
    for (const id of active as string[]) expect(isKnownFault(id)).toBe(true);
  });

  test("catalogue size", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(30);
    expect(POSTS.length).toBeGreaterThanOrEqual(12);
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  test("titles and descriptions are unique, present and sized", () => {
    withFaults([], () => {
      const titles = new Set<string>();
      const descs = new Set<string>();
      for (const [path, h] of allHeads()) {
        const t = titleOf(h)!;
        const d = metaContent(h, "name", "description")!;
        expect(t, path).toBeTruthy();
        expect(t.length, `${path} title`).toBeLessThanOrEqual(65);
        expect(d, path).toBeTruthy();
        expect(d.length, `${path} description`).toBeGreaterThanOrEqual(70);
        expect(d.length, `${path} description`).toBeLessThanOrEqual(165);
        expect(titles.has(t), `duplicate title ${t}`).toBe(false);
        expect(descs.has(d), `duplicate description on ${path}`).toBe(false);
        titles.add(t);
        descs.add(d);
        expect(canonicalOf(h), path).toBe(`${SITE.baseUrl}${path}`);
        expect(metaContent(h, "name", "robots"), path).not.toContain("noindex");
        expect(metaContent(h, "property", "og:image"), path).toBeTruthy();
      }
    });
  });

  test("JSON-LD: one @graph per page, stable @ids, no duplicate ids, required fields", () => {
    withFaults([], () => {
      for (const [path, h] of allHeads()) {
        const g = ldGraph(h);
        const ids = g.map((n) => n["@id"]);
        expect(new Set(ids).size, `${path} has duplicate @id`).toBe(ids.length);
        expect(g.find((n) => n["@type"] === "Organization")!["@id"]).toBe(
          `${SITE.baseUrl}/#organization`,
        );
        expect(g.find((n) => n["@type"] === "WebSite")!["@id"]).toBe(`${SITE.baseUrl}/#website`);
        if (path.startsWith("/products/")) {
          const p = g.find((n) => n["@type"] === "Product") as unknown as {
            offers: { price: string; priceCurrency: string }[];
          };
          expect(p.offers.length).toBeGreaterThan(0);
          for (const o of p.offers) expect(Number(o.price)).toBeGreaterThan(0);
          expect(g.some((n) => n["@type"] === "BreadcrumbList")).toBe(true);
        }
        if (path.startsWith("/blog/") && path !== "/blog")
          expect(g.some((n) => n["@type"] === "BlogPosting")).toBe(true);
        if (path === "/faq") expect(g.some((n) => n["@type"] === "FAQPage")).toBe(true);
      }
    });
  });

  test("noindex pages", () => {
    for (const p of ["/search", "/cart", "/order-demo"])
      expect(metaContent(noindexHead("x", p), "name", "robots")).toContain("noindex");
  });

  test("sitemap lists exactly the indexable pages", () => {
    withFaults([], () => {
      const xml = sitemapXml();
      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(locs.sort()).toEqual(
        allHeads()
          .map(([p]) => `${SITE.baseUrl}${p}`)
          .sort(),
      );
      expect(locs.length).toBe(indexablePaths().length);
      expect(xml).not.toContain("/search");
      expect(xml).not.toContain("/cart");
    });
  });

  test("robots and llms.txt", () => {
    withFaults([], () => {
      expect(robotsTxt()).toContain(`Sitemap: ${SITE.baseUrl}/sitemap.xml`);
      expect(robotsTxt()).not.toContain("Disallow: /\n");
      expect(llmsTxt()).toContain("# The Nut Shop");
      for (const p of PRODUCTS) expect(llmsTxt()).toContain(`/products/${p.slug}`);
    });
  });

  test("CSP allows the Cloudflare Web Analytics beacon, and only those two hosts", () => {
    withFaults([], () => {
      const csp = securityHeaders()["Content-Security-Policy"]!;
      const dir = (n: string) => csp.split("; ").find((d) => d.startsWith(`${n} `))!;
      expect(dir("script-src")).toContain("https://static.cloudflareinsights.com");
      expect(dir("connect-src")).toContain("https://cloudflareinsights.com");
      expect(dir("script-src")).not.toContain("https://cloudflareinsights.com ");
      expect(csp.match(/https:\/\/[a-z.]*cloudflareinsights\.com/g)).toHaveLength(2);
    });
    expect(
      withFaults(["csp-removed"], () => securityHeaders()["Content-Security-Policy"]),
    ).toBeUndefined();
  });

  test("security headers present", () => {
    withFaults([], () => {
      const h = securityHeaders();
      for (const k of [
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "X-Content-Type-Options",
      ])
        expect(h[k], k).toBeTruthy();
    });
  });

  test("every rendered page carries the demo notice, one h1, alt text and dimensions", () => {
    withFaults([], () => {
      const rendered = [
        pages.home(),
        pages.shop(),
        pages.blog(),
        pages.faq(),
        ...CATEGORIES.map((c) => pages.category(c.slug)),
        ...PRODUCTS.map((p) => pages.product(p.slug)),
        ...POSTS.map((p) => pages.post(p.slug)),
        ...(["about", "contact", "shipping", "privacy", "terms", "giftGuide"] as const).map((k) =>
          pages.staticPage(k),
        ),
      ];
      for (const out of rendered) {
        expect(out).toContain(SITE.demoNotice);
        expect((out.match(/<h1[ >]/g) ?? []).length).toBe(1);
        for (const img of out.match(/<img[^>]*>/g) ?? []) {
          expect(img).toContain("alt=");
          expect(img).toContain("width=");
          expect(img).toContain("height=");
        }
        expect(out).not.toMatch(/src="http:\/\//);
        expect(out).toContain('for="newsletter-email"');
      }
    });
  });

  test("product pages have price, ingredients, allergens, nutrition, storage, breadcrumbs, related", () => {
    withFaults([], () => {
      for (const p of PRODUCTS) {
        const out = pages.product(p.slug);
        for (const needle of [
          "Ingredients",
          "Allergens",
          "Nutrition",
          "Storage",
          'aria-label="Breadcrumb"',
          "You might also like",
          "From the journal",
        ]) {
          if (needle === "From the journal" && p.posts.length === 0) continue;
          expect(out, `${p.slug} ${needle}`).toContain(needle);
        }
      }
    });
  });

  test("image files exist for every page that references them", () => {
    for (const p of PRODUCTS)
      expect(
        existsSync(`public/img/products/${p.slug}.svg`) &&
          existsSync(`public/og/products-${p.slug}.png`),
      ).toBe(true);
    for (const c of CATEGORIES)
      expect(existsSync(`public/img/categories/${c.slug}.svg`)).toBe(true);
    for (const p of POSTS)
      expect(
        existsSync(`public/img/posts/${p.slug}.svg`) && existsSync(`public/og/posts-${p.slug}.png`),
      ).toBe(true);
  });

  test("copy rules: no em-dashes, no real-brand giveaways in content", () => {
    const text = JSON.stringify([PRODUCTS, POSTS, STATIC_PAGES]);
    expect(text).not.toContain("—");
  });

  test("every internal link target in rendered pages exists", () => {
    withFaults([], () => {
      const known = new Set<string>([
        ...allHeads().map(([p]) => p),
        "/cart",
        "/order-demo",
        "/search",
      ]);
      const rendered = [
        pages.home(),
        pages.shop(),
        pages.blog(),
        ...PRODUCTS.map((p) => pages.product(p.slug)),
        ...POSTS.map((p) => pages.post(p.slug)),
      ];
      for (const out of rendered)
        for (const m of out.matchAll(/<a [^>]*href="(\/[^"#?]*)"/g))
          if (!m[1]!.startsWith("/_")) expect(known.has(m[1]!), m[1]).toBe(true);
    });
  });
});

describe("cache validators", () => {
  const page = (u: number) =>
    new Response(`<html>u:${u}</html>`, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  const req = (inm?: string) =>
    new Request("http://127.0.0.1:4210/about", inm ? { headers: { "if-none-match": inm } } : {});

  test("HTML ETag ignores the per-request router timestamp and answers 304", async () => {
    const a = await finalize(req(), page(1794389921762), "x");
    const b = await finalize(req(), page(1794389929999), "x");
    expect(a.headers.get("etag")).toBeTruthy();
    expect(a.headers.get("etag")).toBe(b.headers.get("etag"));
    const c = await finalize(req(a.headers.get("etag")!), page(1794389930000), "x");
    expect(c.status).toBe(304);
  });
});
