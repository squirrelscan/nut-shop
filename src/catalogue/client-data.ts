/**
 * Client-only catalogue details: reviews, a pack price table, stock by depot and "pairs well
 * with" links. Loaded with a dynamic import() from a useEffect, so none of this is in the
 * server-rendered HTML: a non-rendered audit sees the shell, a rendered audit sees all of it.
 * Deterministic: everything derives from the catalogue seed and the item slug.
 */
import phrases from "./client-phrases.json";
import {
  CATALOGUE_SEED,
  catalogue,
  hash,
  itemPath,
  pick,
  rng,
  type CatalogueItem,
} from "./generate";

export type Review = { author: string; rating: number; date: string; body: string };
export type PackPrice = { label: string; priceCents: number; per100gCents: number };
export type Stock = { depot: string; units: number };
export type ClientDetails = {
  badge: string;
  rating: number;
  reviews: Review[];
  prices: PackPrice[];
  stock: Stock[];
  pairs: { name: string; path: string }[];
};

const PACKS = [
  { label: "150 g bag", grams: 150, discount: 1 },
  { label: "400 g bag", grams: 400, discount: 0.93 },
  { label: "1 kg bag", grams: 1000, discount: 0.85 },
];

const fill = (s: string, item: CatalogueItem, pack: string) =>
  s
    .replace("{style}", item.style.toLowerCase())
    .replace("{nut}", item.nutPlural.replace(/s$/, ""))
    .replace("{pack}", pack);

export function clientDetails(item: CatalogueItem): ClientDetails {
  const r = rng(hash(`client:${CATALOGUE_SEED}:${item.slug}`));
  const prices = PACKS.map((p) => {
    const priceCents = Math.round((item.per100gCents * (p.grams / 100) * p.discount) / 10) * 10 + 9;
    return { label: p.label, priceCents, per100gCents: Math.round(priceCents / (p.grams / 100)) };
  });
  const n = 3 + Math.floor(r() * 6);
  const reviews: Review[] = Array.from({ length: n }, () => {
    const rating = Math.min(5, 3 + Math.floor(r() * 3) + (r() > 0.6 ? 1 : 0));
    const day = 1 + Math.floor(r() * 28);
    const month = 1 + Math.floor(r() * 10);
    return {
      author: `${pick(r, phrases.reviewers)} ${String.fromCharCode(65 + Math.floor(r() * 26))}.`,
      rating,
      date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      body: [pick(r, phrases.openers), pick(r, phrases.praise), pick(r, phrases.quibbles)]
        .map((s) => fill(s, item, pick(r, PACKS).label))
        .join(" "),
    };
  });
  const rating = Math.round((reviews.reduce((s, x) => s + x.rating, 0) / reviews.length) * 10) / 10;
  const stock = phrases.warehouses.map((depot) => ({
    depot,
    units: r() < 0.15 ? 0 : Math.floor(r() * 240),
  }));
  const all = catalogue();
  const pairs: { name: string; path: string }[] = [];
  while (pairs.length < 4) {
    const x = pick(r, all);
    if (x.slug !== item.slug && !pairs.some((p) => p.path === itemPath(x)))
      pairs.push({ name: x.name, path: itemPath(x) });
  }
  return { badge: pick(r, phrases.badges), rating, reviews, prices, stock, pairs };
}
