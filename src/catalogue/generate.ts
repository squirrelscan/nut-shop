/**
 * The /catalogue/ section: 2,100 product pages generated deterministically from a fixed seed.
 * No network, no third-party data, no files: the same seed always yields the same catalogue,
 * on the server (SSR at request time) and in tests. Kept apart from the fault system on purpose:
 * nothing here (or in ./pages.tsx) calls fault(), so fault toggles never change /catalogue/.
 */

export const CATALOGUE_SEED = 2490;
export const CATALOGUE_SIZE = 2100;
export const PAGE_SIZE = 60;
export const PAGE_COUNT = Math.ceil(CATALOGUE_SIZE / PAGE_SIZE);

/** mulberry32: small, fast, deterministic PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash, used to derive per-item seeds from a slug. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;

type Nut = {
  key: string;
  plural: string;
  /** Existing illustration in public/img/products. */
  image: string;
  per100gCents: number;
  note: string;
  uses: string;
};

const NUTS: Nut[] = [
  {
    key: "almond",
    plural: "almonds",
    image: "raw-almonds",
    per100gCents: 260,
    note: "a firm, clean snap and a gentle marzipan sweetness",
    uses: "granola, salads, frangipane and a handful at your desk",
  },
  {
    key: "cashew",
    plural: "cashews",
    image: "raw-cashews",
    per100gCents: 310,
    note: "a soft, creamy bite and a buttery finish",
    uses: "stir-fries, curries, cashew cream and late-afternoon snacking",
  },
  {
    key: "walnut",
    plural: "walnuts",
    image: "raw-walnut-halves",
    per100gCents: 290,
    note: "a tender crunch and a pleasant, tannic edge",
    uses: "banana bread, beetroot salads, pesto and cheese boards",
  },
  {
    key: "pecan",
    plural: "pecans",
    image: "raw-pecan-halves",
    per100gCents: 380,
    note: "a rich, almost toffee-like flavour and a crisp edge",
    uses: "pies, porridge toppings, roasted squash and brownies",
  },
  {
    key: "hazelnut",
    plural: "hazelnuts",
    image: "raw-hazelnuts",
    per100gCents: 300,
    note: "a toasty, cocoa-friendly flavour and a round crunch",
    uses: "chocolate bakes, praline, dukkah and green beans",
  },
  {
    key: "peanut",
    plural: "peanuts",
    image: "honey-roasted-peanuts",
    per100gCents: 120,
    note: "a familiar roasted savouriness and a light crunch",
    uses: "satay sauces, noodle bowls, cookies and match-day bowls",
  },
  {
    key: "brazil",
    plural: "Brazil nuts",
    image: "raw-brazil-nuts",
    per100gCents: 340,
    note: "a large, creamy kernel with a mild coconut note",
    uses: "trail mixes, chocolate bark and slow snacking",
  },
  {
    key: "pistachio",
    plural: "pistachios",
    image: "roasted-salted-pistachios",
    per100gCents: 450,
    note: "a bright green kernel with a sweet, resinous flavour",
    uses: "baklava, ice cream, pilaf and crusts for fish",
  },
  {
    key: "pine",
    plural: "pine nuts",
    image: "pine-nuts",
    per100gCents: 690,
    note: "a delicate, buttery flavour and a soft bite",
    uses: "pesto, couscous, roasted vegetables and pasta",
  },
];

type Style = { name: string; how: string; mult: number; category: string };

const STYLES: Style[] = [
  { name: "Raw", how: "left unroasted and unsalted", mult: 1, category: "Raw nuts" },
  {
    name: "Dry roasted",
    how: "dry roasted with no added oil",
    mult: 1.08,
    category: "Roasted nuts",
  },
  {
    name: "Sea salted",
    how: "roasted and tossed with flaky sea salt",
    mult: 1.1,
    category: "Roasted nuts",
  },
  {
    name: "Honey roasted",
    how: "glazed with honey and roasted until amber",
    mult: 1.18,
    category: "Roasted nuts",
  },
  {
    name: "Smoked",
    how: "cold smoked over oak chips, then roasted",
    mult: 1.2,
    category: "Roasted nuts",
  },
  {
    name: "Maple glazed",
    how: "coated in maple syrup and baked until glossy",
    mult: 1.22,
    category: "Roasted nuts",
  },
  {
    name: "Chilli lime",
    how: "roasted with chilli flakes and lime zest",
    mult: 1.17,
    category: "Roasted nuts",
  },
  {
    name: "Rosemary",
    how: "roasted with rosemary, garlic and a little oil",
    mult: 1.15,
    category: "Roasted nuts",
  },
  {
    name: "Activated",
    how: "soaked overnight, then dried low and slow",
    mult: 1.25,
    category: "Raw nuts",
  },
  { name: "Blanched", how: "skinned in hot water and air dried", mult: 1.12, category: "Baking" },
  { name: "Cinnamon", how: "roasted with cinnamon sugar", mult: 1.16, category: "Roasted nuts" },
  {
    name: "Dark chocolate",
    how: "panned in 70% dark chocolate",
    mult: 1.4,
    category: "Gift boxes",
  },
  {
    name: "Tamari",
    how: "roasted with tamari and a pinch of sugar",
    mult: 1.14,
    category: "Roasted nuts",
  },
  {
    name: "Black pepper",
    how: "roasted with cracked black pepper and salt",
    mult: 1.13,
    category: "Roasted nuts",
  },
  {
    name: "Lemon herb",
    how: "roasted with lemon zest, thyme and oregano",
    mult: 1.15,
    category: "Roasted nuts",
  },
  {
    name: "Caramelised",
    how: "cooked in a light caramel and cooled in clusters",
    mult: 1.3,
    category: "Gift boxes",
  },
];

/** Fictional growers. None of these are real businesses. */
const FARMS = [
  "Alder Creek",
  "Bramble Hill",
  "Cedar Hollow",
  "Dunmore Flats",
  "Elm Ridge",
  "Fernvale",
  "Greywater",
  "Harlow Bend",
  "Ironbark",
  "Juniper Gate",
  "Kestrel Downs",
  "Larkspur",
  "Millbrook",
  "Northwood",
  "Oakhurst",
];

const HARVEST = ["August", "September", "October", "November", "December", "January", "March"];
const GRADES = ["standard", "select", "extra large", "premium halves", "kitchen grade"];

export type CatalogueItem = {
  index: number;
  slug: string;
  sku: string;
  name: string;
  nut: string;
  nutPlural: string;
  style: string;
  farm: string;
  category: string;
  image: string;
  grade: string;
  harvest: string;
  /** Price of the smallest pack, in cents. */
  fromCents: number;
  /** Price per 100 g, in cents. */
  per100gCents: number;
  tagline: string;
  metaDescription: string;
  description: string[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function build(): CatalogueItem[] {
  const combos: [Nut, Style, string][] = [];
  for (const n of NUTS) for (const s of STYLES) for (const f of FARMS) combos.push([n, s, f]);
  // Seeded Fisher-Yates shuffle, then take the first CATALOGUE_SIZE.
  const r = rng(CATALOGUE_SEED);
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [combos[i], combos[j]] = [combos[j]!, combos[i]!];
  }
  return combos.slice(0, CATALOGUE_SIZE).map(([n, s, farm], index) => {
    const name = `${s.name} ${n.plural}, ${farm}`;
    const slug = slugify(`${s.name} ${n.plural} ${farm}`);
    const ir = rng(hash(`${CATALOGUE_SEED}:${slug}`));
    const per100 = Math.round((n.per100gCents * s.mult * (0.9 + ir() * 0.25)) / 5) * 5;
    const fromCents = Math.round((per100 * 1.5) / 10) * 10 + 9;
    const grade = pick(ir, GRADES);
    const harvest = pick(ir, HARVEST);
    const tagline = `${s.name} ${n.plural} from ${farm}, ${s.how}.`;
    const metaDescription = `${s.name} ${n.plural} from the fictional ${farm} farm: ${s.how}. ${grade[0]!.toUpperCase()}${grade.slice(1)} grade. Demo item, not for sale.`;
    const description = [
      `These ${lower(s.name)} ${n.plural} come from ${farm}, a made-up grower in our demo catalogue. They are ${s.how}, which keeps ${n.note}. We pack them in resealable bags the week they are finished.`,
      `The ${harvest} harvest was sorted to ${grade} grade, so the kernels are even in size and roast evenly. Use them in ${n.uses}, or eat them straight from the bag.`,
      `Store the bag sealed, somewhere cool and dark, and finish it within three months of opening. ${s.category === "Raw nuts" ? "Raw nuts keep longest in the fridge." : "Roasted and coated nuts are best in the first few weeks."} Like everything in The Nut Shop, this item is fictional and nothing here is for sale.`,
    ];
    return {
      index,
      slug,
      sku: `NS-C-${String(index + 1).padStart(4, "0")}`,
      name,
      nut: n.key,
      nutPlural: n.plural,
      style: s.name,
      farm,
      category: s.category,
      image: n.image,
      grade,
      harvest,
      fromCents,
      per100gCents: per100,
      tagline,
      metaDescription,
      description,
    };
  });
}

let cache: CatalogueItem[] | null = null;
let bySlug: Map<string, CatalogueItem> | null = null;

export function catalogue(): CatalogueItem[] {
  cache ??= build();
  return cache;
}

export function getCatalogueItem(slug: string): CatalogueItem | undefined {
  bySlug ??= new Map(catalogue().map((i) => [i.slug, i]));
  return bySlug.get(slug);
}

/** Items on listing page n (1-based). */
export const cataloguePage = (n: number): CatalogueItem[] =>
  catalogue().slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE);

export const pageOf = (item: CatalogueItem): number => Math.floor(item.index / PAGE_SIZE) + 1;

export const listingPath = (n: number): string => (n === 1 ? "/catalogue" : `/catalogue/page/${n}`);
export const itemPath = (item: CatalogueItem): string => `/catalogue/${item.slug}`;

/** Server-rendered related items: 3 of the same nut, 3 of the same style, all deterministic. */
export function relatedItems(item: CatalogueItem): CatalogueItem[] {
  const all = catalogue();
  const r = rng(hash(`related:${item.slug}`));
  const sameNut = all.filter((x) => x.nut === item.nut && x.slug !== item.slug);
  const sameStyle = all.filter((x) => x.style === item.style && x.slug !== item.slug);
  const out: CatalogueItem[] = [];
  const take = (xs: CatalogueItem[], k: number) => {
    let guard = 0;
    while (k > 0 && guard++ < 100) {
      const x = pick(r, xs);
      if (!out.includes(x)) {
        out.push(x);
        k--;
      }
    }
  };
  take(sameNut, 3);
  take(sameStyle, 3);
  return out;
}

/** Every catalogue URL, for the catalogue sitemap. */
export const cataloguePaths = (): string[] => [
  ...Array.from({ length: PAGE_COUNT }, (_, i) => listingPath(i + 1)),
  ...catalogue().map(itemPath),
];
