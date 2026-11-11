/**
 * Generates original SVG illustrations (public/img) and PNG social cards
 * (public/og) from the content. Deterministic. Run: bun run images
 */
import sharp from "sharp";
import { CATEGORIES } from "../src/content/catalog";
import type { Post, Product } from "../src/content/types";

const products: Product[] = await Bun.file("src/content/generated/products.json").json();
const posts: Post[] = await Bun.file("src/content/generated/posts.json").json();

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const rng = (seed: string) => {
  let a = hash(seed);
  return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
};

// Flat tiles: [background, table band]. No gradients, no decorative circles.
const PAL: Record<string, [string, string]> = {
  "raw-nuts": ["#f0dfbd", "#e2c993"],
  "roasted-nuts": ["#f2cfa3", "#e0ab70"],
  "nut-butters": ["#f6dfa0", "#e8c066"],
  "trail-mixes": ["#dfe4bd", "#c4cf8f"],
  "gift-boxes": ["#f2cdbc", "#e3a48c"],
  baking: ["#eadfce", "#d6c4a6"],
  blog: ["#e4ead6", "#c6d6ae"],
};
const INK = "#3d2412";
const NUT_FILL: Record<string, [string, string]> = {
  almond: ["#c58b57", "#8a5a2e"],
  cashew: ["#e6cf9e", "#b99552"],
  walnut: ["#b98a5a", "#7a5230"],
  pecan: ["#9a5b34", "#5e3319"],
  hazelnut: ["#b4743f", "#74441d"],
  peanut: ["#d9b27c", "#a77d44"],
  brazil: ["#8a6a4a", "#4f3822"],
  pistachio: ["#a9c36b", "#6b8a35"],
  pine: ["#f0dfb0", "#cfb36d"],
};

function nut(kind: string, x: number, y: number, s: number, rot: number): string {
  const [a, b] = NUT_FILL[kind] ?? NUT_FILL.almond!;
  const g = `transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${s.toFixed(2)})"`;
  const fill = `fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;
  switch (kind) {
    case "almond":
      return `<g ${g}><path d="M0-34C16-22 22-4 12 22 6 32-6 32-12 22-22-4-16-22 0-34Z" ${fill}/><path d="M0-24C2-8 2 8 0 22" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" fill="none"/></g>`;
    case "cashew":
      return `<g ${g}><path d="M-26-8C-24-26 4-32 20-20 30-12 28 2 20 8 14 12 10 6 14 0 18-8 6-14-6-8-12-4-12 14-4 24-14 26-28 14-26-8Z" ${fill}/></g>`;
    case "walnut":
      return `<g ${g}><circle r="26" ${fill}/><path d="M0-26C-8-10 8 6 0 26M-18-14C-8-8-8 8-18 14M18-14C8-8 8 8 18 14" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/></g>`;
    case "pecan":
      return `<g ${g}><ellipse rx="16" ry="30" ${fill}/><path d="M-6-24C-8-8-8 8-6 24M6-24C8-8 8 8 6 24" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/></g>`;
    case "hazelnut":
      return `<g ${g}><circle r="24" ${fill}/><path d="M-24-4C-12-18 12-18 24-4L20-18C8-30-8-30-20-18Z" fill="${b}"/></g>`;
    case "peanut":
      return `<g ${g}><path d="M-26-10C-26-24-6-24-4-10-2-4 2-4 4-10 6-24 26-24 26-10 26 4 10 6 8 12 6 28-26 28-26 10Z" transform="scale(1 .8)" ${fill}/></g>`;
    case "brazil":
      return `<g ${g}><path d="M0-34C20-26 26 10 10 30-10 30-26 10-22-14-18-28-8-32 0-34Z" ${fill}/><path d="M0-34L0 30" stroke="${b}" stroke-width="2"/></g>`;
    case "pistachio":
      return `<g ${g}><path d="M0-30C16-24 20 4 10 24 4 30-4 30-10 24-20 4-16-24 0-30Z" fill="#e8dcc0" stroke="#b9a77d" stroke-width="3"/><path d="M0-22C8-18 10-4 4 8-6 8-8-6-6-18Z" fill="${a}" stroke="${b}" stroke-width="2"/></g>`;
    case "pine":
      return `<g ${g}><path d="M0-30C8-26 8 26 0 30-8 26-8-26 0-30Z" ${fill}/></g>`;
    default:
      return "";
  }
}

const KINDS = Object.keys(NUT_FILL);
function pile(
  seed: string,
  kinds: string[],
  cx: number,
  cy: number,
  w: number,
  count: number,
  scale: number,
): string {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const k = kinds[i % kinds.length]!;
    const x = cx + (r() - 0.5) * w;
    const y = cy - Math.abs(r() - 0.4) * w * 0.28 + (i % 3) * 6;
    out += nut(k, x, y, scale * (0.85 + r() * 0.3), r() * 360);
  }
  return out;
}

function frame(w: number, h: number, c: [string, string], inner: string, label?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true"><rect width="${w}" height="${h}" fill="${c[0]}"/><rect y="${h * 0.74}" width="${w}" height="${h * 0.26}" fill="${c[1]}"/>${inner}${label ? `<text x="${w / 2}" y="${h - 28}" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="${INK}">${label}</text>` : ""}</svg>`;
}

function productSvg(p: Product): string {
  const c = PAL[p.category]!;
  const kinds =
    p.nut === "mixed" ? ["almond", "cashew", "walnut", "hazelnut", "pecan", "pistachio"] : [p.nut];
  let inner = "";
  const W = 800,
    H = 600;
  if (p.category === "nut-butters") {
    inner = `<rect x="300" y="170" width="200" height="40" rx="10" fill="${INK}"/><rect x="285" y="205" width="230" height="260" rx="34" fill="#f8f1e4" stroke="${INK}" stroke-width="6"/><rect x="315" y="260" width="170" height="130" rx="14" fill="${NUT_FILL[p.nut]?.[0] ?? "#d9b27c"}"/>${nut(p.nut, 400, 325, 1.5, 0)}<ellipse cx="400" cy="490" rx="150" ry="16" fill="#000" opacity=".12"/>`;
  } else if (p.category === "gift-boxes") {
    inner = `<rect x="190" y="260" width="420" height="220" rx="12" fill="#b45a45" stroke="#7a3a2c" stroke-width="5"/><rect x="170" y="215" width="460" height="64" rx="12" fill="#c8705a" stroke="#7a3a2c" stroke-width="5"/><rect x="375" y="215" width="50" height="265" fill="#f3d9a6"/><path d="M400 215C350 150 290 190 340 215ZM400 215C450 150 510 190 460 215Z" fill="#f3d9a6" stroke="#b98a3a" stroke-width="4"/>${pile(p.slug, KINDS, 400, 190, 180, 5, 0.6)}`;
  } else {
    inner = `<ellipse cx="400" cy="470" rx="250" ry="30" fill="#000" opacity=".12"/><path d="M170 330H630C630 440 540 490 400 490 260 490 170 440 170 330Z" fill="#f8f1e4" stroke="${INK}" stroke-width="6"/>${pile(p.slug, kinds, 400, 335, 360, p.nut === "mixed" ? 22 : 16, 1.25)}<path d="M180 345H620" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  }
  return frame(W, H, c, inner);
}

function categorySvg(slug: string): string {
  const c = PAL[slug]!;
  const kinds =
    slug === "raw-nuts"
      ? ["almond", "walnut", "hazelnut"]
      : slug === "roasted-nuts"
        ? ["cashew", "peanut", "pecan"]
        : slug === "nut-butters"
          ? ["peanut", "almond"]
          : slug === "baking"
            ? ["almond", "pine", "walnut"]
            : KINDS;
  return frame(800, 500, c, pile(slug, kinds, 400, 310, 560, 22, 2.2));
}

function postSvg(p: Post): string {
  const r = rng(p.slug);
  const kinds = [
    KINDS[hash(p.slug) % KINDS.length]!,
    KINDS[(hash(p.slug) >> 3) % KINDS.length]!,
    KINDS[(hash(p.slug) >> 6) % KINDS.length]!,
  ];
  let inner = "";
  for (let i = 0; i < 14; i++)
    inner += nut(kinds[i % 3]!, 80 + r() * 1040, 90 + r() * 450, 1.4 + r() * 1.2, r() * 360);
  return frame(1200, 630, PAL.blog!, inner);
}

const ogCard = (heroSvg: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f0dfbd"/><g transform="translate(0 90)">${heroSvg.replace(/^<svg[^>]*>/, '<svg width="1200" height="600" viewBox="0 0 1200 600">')}</g><rect x="60" y="60" width="620" height="230" rx="28" fill="#fffbf3" stroke="${INK}" stroke-width="4"/><text x="100" y="170" font-family="Georgia,serif" font-weight="700" font-size="84" fill="${INK}">The Nut Shop</text><text x="100" y="235" font-family="Georgia,serif" font-size="34" fill="#5b452e">Good nuts, small batches. A demo store.</text></svg>`;

const w = (path: string, data: string) => Bun.write(`public/${path}`, data);

const hero = frame(1200, 600, PAL["raw-nuts"]!, pile("hero", KINDS, 600, 400, 1000, 30, 3.1));
await w("img/hero.svg", hero);
const jobs: Promise<unknown>[] = [
  sharp(Buffer.from(ogCard(hero)))
    .png()
    .toFile("public/og/home.png"),
];
await Bun.write("public/og/.keep", "");
for (const p of products) {
  const svg = productSvg(p);
  await w(`img/products/${p.slug}.svg`, svg);
  jobs.push(
    sharp(Buffer.from(svg))
      .resize(1200, 630, { fit: "cover" })
      .png({ palette: true })
      .toFile(`public/og/products-${p.slug}.png`),
  );
}
for (const c of CATEGORIES) {
  const svg = categorySvg(c.slug);
  await w(`img/categories/${c.slug}.svg`, svg);
  jobs.push(
    sharp(Buffer.from(svg))
      .resize(1200, 630, { fit: "cover" })
      .png({ palette: true })
      .toFile(`public/og/categories-${c.slug}.png`),
  );
}
for (const p of posts) {
  const svg = postSvg(p);
  await w(`img/posts/${p.slug}.svg`, svg);
  const og = svg.replace(
    "</svg>",
    `<rect x="60" y="200" width="1080" height="230" rx="28" fill="#fffbf3" stroke="${INK}" stroke-width="4"/><text x="600" y="320" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="48" fill="${INK}">${p.title.replace(/&/g, "&amp;")}</text><text x="600" y="380" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#5b452e">The Nut Shop journal</text></svg>`,
  );
  jobs.push(sharp(Buffer.from(og)).png({ palette: true }).toFile(`public/og/posts-${p.slug}.png`));
}
await Promise.all(jobs);
console.log("images ok");
