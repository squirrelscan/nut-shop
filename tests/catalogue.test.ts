import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { FAULT_IDS } from "../faults/registry";
import { withFaults } from "../faults/runtime";
import {
  CATALOGUE_SIZE,
  PAGE_COUNT,
  catalogue,
  cataloguePage,
  cataloguePaths,
  getCatalogueItem,
  itemPath,
  listingPath,
  relatedItems,
} from "#/catalogue/generate";
import { clientDetails } from "#/catalogue/client-data";
import { itemHead, listingHead } from "#/catalogue/head";
import { CatalogueItemPage, CatalogueListingPage } from "#/catalogue/pages";
import { isCataloguePath } from "#/catalogue/paths";
import { catalogueSitemapXml } from "#/catalogue/sitemap";
import { htmlLang } from "#/lib/html";
import { robotsTxt, sitemapXml } from "#/seo/sitemap";
import { cacheControl, securityHeaders } from "#/server/headers";
import { canonicalOf, html, metaContent, pages, titleOf } from "./helpers";

const itemHtml = (slug: string) =>
  html(createElement(CatalogueItemPage, { item: getCatalogueItem(slug)! }));
const listingHtml = (n: number) => html(createElement(CatalogueListingPage, { page: n }));
const hrefs = (s: string) => [...s.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);

describe("catalogue", () => {
  const items = catalogue();

  test("has 2,100 items with unique slugs, titles and descriptions", () => {
    expect(items.length).toBe(CATALOGUE_SIZE);
    expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(2000);
    const titles = new Set<string>();
    const descs = new Set<string>();
    const slugs = new Set<string>();
    for (const it of items) {
      const h = itemHead(it);
      const t = titleOf(h)!;
      const d = metaContent(h, "name", "description")!;
      expect(t.length, t).toBeLessThanOrEqual(65);
      expect(d.length, d).toBeGreaterThanOrEqual(70);
      expect(d.length, d).toBeLessThanOrEqual(165);
      expect(it.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(canonicalOf(h)).toEndWith(itemPath(it));
      titles.add(t);
      descs.add(d);
      slugs.add(it.slug);
    }
    expect(slugs.size).toBe(CATALOGUE_SIZE);
    expect(titles.size).toBe(CATALOGUE_SIZE);
    expect(descs.size).toBe(CATALOGUE_SIZE);
  });

  test("is deterministic (fixed seed)", () => {
    expect(items[0]!.slug).toBe("smoked-peanuts-millbrook");
    expect(items[CATALOGUE_SIZE - 1]!.sku).toBe("NS-C-2100");
    const again = JSON.stringify(items);
    expect(JSON.stringify(catalogue())).toBe(again);
    expect(clientDetails(items[7]!)).toEqual(clientDetails(items[7]!));
  });

  test("every item is linked from exactly one listing page; listings link every page", () => {
    const seen = new Map<string, number>();
    for (let n = 1; n <= PAGE_COUNT; n++) {
      const links = hrefs(listingHtml(n));
      for (let k = 1; k <= PAGE_COUNT; k++)
        if (k !== n) expect(links, `page ${n} -> ${k}`).toContain(listingPath(k));
      for (const it of cataloguePage(n)) {
        expect(links).toContain(itemPath(it));
        seen.set(it.slug, (seen.get(it.slug) ?? 0) + 1);
      }
    }
    expect(seen.size).toBe(CATALOGUE_SIZE);
    expect([...seen.values()].every((c) => c === 1)).toBe(true);
  });

  test("listing heads are unique and sized", () => {
    const titles = new Set<string>();
    for (let n = 1; n <= PAGE_COUNT; n++) {
      const h = listingHead(n);
      titles.add(titleOf(h)!);
      expect(canonicalOf(h)).toEndWith(listingPath(n));
      const d = metaContent(h, "name", "description")!;
      expect(d.length).toBeGreaterThanOrEqual(70);
      expect(d.length).toBeLessThanOrEqual(165);
    }
    expect(titles.size).toBe(PAGE_COUNT);
  });

  test("server HTML has the shell and related links but no client-rendered content", () => {
    const it = items[123]!;
    const s = itemHtml(it.slug);
    expect(s).toContain(`<h1>${it.name}</h1>`);
    expect(s).toContain('data-catalogue-client="pending"');
    for (const marker of [
      "Customer reviews",
      "Stock by depot",
      "Pack sizes and prices",
      "Pairs well with",
    ])
      expect(s).not.toContain(marker);
    const related = relatedItems(it);
    expect(related.length).toBe(6);
    for (const r of related) expect(hrefs(s)).toContain(itemPath(r));
    // Every internal catalogue link resolves to a real page.
    for (const h of hrefs(s).filter((x) => x.startsWith("/catalogue/") && !x.includes("/page/")))
      expect(getCatalogueItem(h.slice("/catalogue/".length)), h).toBeDefined();
  });

  test("client details are substantial and link to real items", () => {
    for (const it of items.slice(0, 50)) {
      const d = clientDetails(it);
      expect(d.reviews.length).toBeGreaterThanOrEqual(3);
      expect(d.prices.length).toBe(3);
      expect(d.stock.length).toBe(4);
      expect(d.pairs.length).toBe(4);
      for (const p of d.pairs)
        expect(getCatalogueItem(p.path.slice("/catalogue/".length))).toBeDefined();
    }
  });

  test("sitemap: separate file lists every catalogue URL, main sitemap unchanged", () => {
    const locs = [...catalogueSitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(locs.length).toBe(CATALOGUE_SIZE + PAGE_COUNT);
    expect(new Set(locs).size).toBe(locs.length);
    expect(cataloguePaths().length).toBe(locs.length);
    expect(sitemapXml()).not.toContain("/catalogue");
    // Not advertised: capped fault-smoke audits seeded at / must not spend budget on it.
    expect(robotsTxt()).not.toContain("catalogue");
    for (const page of [pages.home(), pages.footer(), pages.shop()])
      expect(page).not.toContain("/catalogue");
  });

  test("isolated from the fault system: every fault on changes nothing in /catalogue/", () => {
    const slug = items[0]!.slug;
    const snap = () => ({
      item: itemHtml(slug),
      listing: listingHtml(1),
      head: JSON.stringify(itemHead(getCatalogueItem(slug)!)),
      listingHead: JSON.stringify(listingHead(2)),
      headers: securityHeaders(itemPath(items[0]!)),
      cache: cacheControl("text/html; charset=utf-8", "/catalogue"),
      lang: htmlLang("/catalogue"),
    });
    const off = withFaults([], snap);
    const on = withFaults(FAULT_IDS, snap);
    expect(on).toEqual(off);
    expect(on.lang).toBe("en");
    // ...while the same faults still change the rest of the site.
    expect(withFaults(["csp-removed"], () => securityHeaders("/"))).not.toHaveProperty(
      "Content-Security-Policy",
    );
    expect(withFaults(["html-lang-missing"], () => htmlLang("/"))).toBeUndefined();
    expect(isCataloguePath("/catalogue")).toBe(true);
    expect(isCataloguePath("/catalogues")).toBe(false);
  });
});
