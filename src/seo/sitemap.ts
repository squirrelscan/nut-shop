import { url } from "#/config/site";
import { SITE } from "#/config/site";
import { CATEGORIES, POSTS, PRODUCTS } from "#/content";
import { STATIC_PAGES } from "#/content/pages";
import { escapeXml } from "#/lib/format";
import { fault } from "../../faults/runtime";

export type SitemapEntry = { path: string; lastmod: string };

/** Every indexable page. Excludes /search, /cart, /order-demo and 404s. */
export function indexablePaths(): SitemapEntry[] {
  const d = SITE.buildDate;
  const entries: SitemapEntry[] = [
    { path: "/", lastmod: d },
    { path: "/shop", lastmod: d },
    ...CATEGORIES.map((c) => ({ path: `/categories/${c.slug}`, lastmod: d })),
    ...PRODUCTS.map((p) => ({ path: `/products/${p.slug}`, lastmod: d })),
    { path: "/blog", lastmod: POSTS[0]!.date },
    ...POSTS.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.date })),
    ...Object.values(STATIC_PAGES).map((p) => ({ path: p.path, lastmod: d })),
    { path: "/faq", lastmod: d },
  ];
  return entries;
}

export function sitemapEntries(): SitemapEntry[] {
  let e = indexablePaths();
  if (fault("sitemap-missing-page")) e = e.filter((x) => x.path !== "/products/pecan-pieces");
  if (fault("sitemap-lists-404"))
    e = [...e, { path: "/products/discontinued-almond-brittle", lastmod: SITE.buildDate }];
  return e;
}

export function sitemapXml(): string {
  const rows = sitemapEntries().map(
    (e) =>
      `  <url>\n    <loc>${escapeXml(url(e.path))}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

export function robotsTxt(): string {
  if (fault("robots-disallow-all"))
    return `User-agent: *\nDisallow: /\n\nSitemap: ${url("/sitemap.xml")}\n`;
  return `User-agent: *\nAllow: /\nDisallow: /search\nDisallow: /cart\nDisallow: /order-demo\n\nSitemap: ${url("/sitemap.xml")}\n`;
}

export function llmsTxt(): string {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.demoNotice} It is a fictional shop for nuts, nut butters, trail mixes and gift boxes, with a journal of guides and recipes.`,
    "",
    "## Shop",
    ...CATEGORIES.map((c) => `- [${c.name}](${url(`/categories/${c.slug}`)}): ${c.intro}`),
    "",
    "## Products",
    ...PRODUCTS.map((p) => `- [${p.name}](${url(`/products/${p.slug}`)}): ${p.tagline}`),
    "",
    "## Journal",
    ...POSTS.map((p) => `- [${p.title}](${url(`/blog/${p.slug}`)}): ${p.description}`),
    "",
    "## About",
    `- [About](${url("/about")})`,
    `- [FAQ](${url("/faq")})`,
    `- [Shipping and returns](${url("/shipping-and-returns")})`,
    `- [Privacy](${url("/privacy")})`,
    `- [Terms](${url("/terms")})`,
    `- [Contact](${url("/contact")})`,
    "",
    "## Optional",
    `- [Sitemap](${url("/sitemap.xml")})`,
    "",
  ];
  return lines.join("\n");
}

export function rssXml(): string {
  const items = POSTS.map(
    (p) =>
      `  <item>\n    <title>${escapeXml(p.title)}</title>\n    <link>${url(`/blog/${p.slug}`)}</link>\n    <guid isPermaLink="true">${url(`/blog/${p.slug}`)}</guid>\n    <pubDate>${new Date(`${p.date}T09:00:00Z`).toUTCString()}</pubDate>\n    <description>${escapeXml(p.description)}</description>\n  </item>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${SITE.name} journal</title>\n  <link>${url("/blog")}</link>\n  <description>Guides, recipes and explainers from a demo nut shop.</description>\n${items}\n</channel>\n</rss>\n`;
}
