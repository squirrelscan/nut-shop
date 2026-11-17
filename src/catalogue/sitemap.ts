import { SITE, url } from "#/config/site";
import { escapeXml } from "#/lib/format";
import { cataloguePaths } from "./generate";

/** Separate sitemap for /catalogue/ (2,135 URLs). Not referenced from robots.txt or /sitemap.xml on purpose. */
export function catalogueSitemapXml(): string {
  const rows = cataloguePaths().map(
    (p) =>
      `  <url>\n    <loc>${escapeXml(url(p))}</loc>\n    <lastmod>${SITE.buildDate}</lastmod>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}
