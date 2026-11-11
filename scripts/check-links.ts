/**
 * Tiny crawler. Usage: bun run check-links [baseUrl] [--external]
 * - crawls internal pages from "/" following <a href>; checks <img>/<link>/<script> targets
 * - reports non-2xx internal targets with referrers, redirects, missing alt, JSON-LD parse errors
 * - compares sitemap.xml with the crawled indexable pages
 * Exit code 1 when internal broken links, JSON-LD errors or sitemap mismatches exist.
 */
const args = process.argv.slice(2);
const external = args.includes("--external");
const base = (args.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:4210").replace(
  /\/+$/,
  "",
);
const origin = new URL(base).origin;

type Info = { status: number; location?: string; type: string; body?: string };
const cache = new Map<string, Info>();
async function get(u: string, wantBody: boolean): Promise<Info> {
  const hit = cache.get(u);
  if (hit && (!wantBody || hit.body !== undefined)) return hit;
  try {
    const r = await fetch(u, {
      redirect: "manual",
      headers: { "user-agent": "nut-shop-check-links" },
    });
    const type = r.headers.get("content-type") ?? "";
    const info: Info = { status: r.status, location: r.headers.get("location") ?? undefined, type };
    if ((wantBody && type.includes("html")) || type.includes("xml")) info.body = await r.text();
    else await r.body?.cancel();
    cache.set(u, info);
    return info;
  } catch {
    const info: Info = { status: 0, type: "" };
    cache.set(u, info);
    return info;
  }
}

const refs = new Map<string, Set<string>>(); // target -> referrers
const pages = new Map<string, Info>();
const problems: string[] = [];
const queue: string[] = [origin + "/"];
const seen = new Set(queue);
const externalLinks = new Map<string, Set<string>>();

const attr = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, "i"))?.[2] ??
  tag.match(new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, "i"))?.[3];

while (queue.length) {
  const page = queue.shift()!;
  const info = await get(page, true);
  pages.set(page, info);
  if (info.status >= 300 && info.status < 400 && info.location) {
    const t = new URL(info.location, page).toString();
    if (t.startsWith(origin) && !seen.has(t)) {
      seen.add(t);
      queue.push(t);
    }
    continue;
  }
  if (!info.body || !info.type.includes("html")) continue;
  const html = info.body;
  const targets: string[] = [];
  for (const m of html.matchAll(/<a\s[^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (href && !/^(mailto:|tel:|javascript:|#)/i.test(href)) targets.push(href);
  }
  const assets: string[] = [];
  for (const m of html.matchAll(/<(img|script|source)\s[^>]*>/gi)) {
    const src = attr(m[0], "src");
    if (src && !src.startsWith("data:")) assets.push(src);
    if (m[1]!.toLowerCase() === "img" && attr(m[0], "alt") === undefined)
      problems.push(`img without alt on ${page}: ${src}`);
  }
  for (const m of html.matchAll(/<link\s[^>]*rel=["'](?:stylesheet|icon|preload)["'][^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (href) assets.push(href);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]!);
    } catch (e) {
      problems.push(`invalid JSON-LD on ${page}: ${(e as Error).message}`);
    }
  }
  for (const t of [...targets, ...assets]) {
    let abs: string;
    try {
      abs = new URL(t, page).toString().split("#")[0]!;
    } catch {
      continue;
    }
    if (!abs.startsWith("http")) continue;
    const isAsset = assets.includes(t);
    if (new URL(abs).origin !== origin) {
      if (!externalLinks.has(abs)) externalLinks.set(abs, new Set());
      externalLinks.get(abs)!.add(page);
      continue;
    }
    if (!refs.has(abs)) refs.set(abs, new Set());
    refs.get(abs)!.add(page);
    if (!seen.has(abs)) {
      seen.add(abs);
      if (isAsset && !/\.html?$/.test(abs) && !targets.includes(t))
        pages.set(abs, await get(abs, false));
      else queue.push(abs);
    }
  }
}

const broken: string[] = [];
const redirects: string[] = [];
for (const [u, info] of pages) {
  if (info.status === 0 || info.status >= 400)
    broken.push(`${info.status} ${u}  <- ${[...(refs.get(u) ?? [])].slice(0, 3).join(", ")}`);
  else if (info.status >= 300)
    redirects.push(
      `${info.status} ${u} -> ${info.location}  <- ${[...(refs.get(u) ?? [])].slice(0, 2).join(", ")}`,
    );
}

// sitemap vs crawl
const sm = await get(origin + "/sitemap.xml", true);
const sitemapUrls = new Set(
  [...(sm.body ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!),
);
const indexable = [...pages]
  .filter(
    ([, i]) =>
      i.status === 200 &&
      i.type.includes("html") &&
      !/name="robots" content="[^"]*noindex/.test(i.body ?? "") &&
      !/rel="canonical" href="(?!([^"]*)")/.test(i.body ?? ""),
  )
  .map(([u]) => u)
  .filter((u) => !/\/(cart|search|order-demo)(\?|$)/.test(u));
const crawledSet = new Set(indexable.map((u) => u.split("?")[0]!));
const missingFromSitemap = [...crawledSet].filter((u) => !sitemapUrls.has(u));
const notCrawled = [...sitemapUrls].filter((u) => !crawledSet.has(u));

console.log(
  `crawled ${pages.size} internal URLs (${[...pages.values()].filter((i) => i.type.includes("html") && i.status === 200).length} HTML pages)`,
);
console.log(`internal broken: ${broken.length}`);
broken.forEach((b) => console.log("  " + b));
console.log(`internal redirects: ${redirects.length}`);
redirects.forEach((b) => console.log("  " + b));
console.log(`other problems: ${problems.length}`);
problems.forEach((b) => console.log("  " + b));
console.log(
  `sitemap: ${sitemapUrls.size} urls; indexable pages crawled but missing from sitemap: ${missingFromSitemap.length}; in sitemap but not indexable/crawled: ${notCrawled.length}`,
);
missingFromSitemap.forEach((u) => console.log("  missing: " + u));
notCrawled.forEach((u) => console.log("  extra: " + u));
console.log(`external links: ${externalLinks.size}`);
let extBroken = 0;
if (external) {
  for (const [u, from] of externalLinks) {
    const r = await fetch(u, {
      redirect: "follow",
      method: "GET",
      headers: { "user-agent": "nut-shop-check-links" },
    }).catch(() => null);
    const s = r?.status ?? 0;
    if (!r || s >= 400) {
      extBroken++;
      console.log(`  external broken ${s} ${u} <- ${[...from][0]}`);
    }
    await r?.body?.cancel();
  }
  console.log(`external broken: ${extBroken}`);
} else externalLinks.forEach((_, u) => console.log("  ext: " + u));

process.exit(
  broken.length || problems.length || missingFromSitemap.length || notCrawled.length || extBroken
    ? 1
    : 0,
);
export {};
