import { SITE, url } from "#/config/site";
import { fault } from "../../faults/runtime";
import { CATEGORIES } from "#/content/catalog";
import type { Category, Post, Product } from "#/content/types";
import { STATIC_PAGES, type StaticPage } from "#/content/pages";
import { LEAK_PAGE_SLUG, leakedConfigScript } from "./fake-secret";
import {
  articleNode,
  breadcrumbNode,
  faqNode,
  graph,
  productNode,
  webPageNode,
  type Crumb,
  type Node,
} from "./jsonld";

export type HeadMeta = Record<string, string>;
export type HeadLink = { rel: string; href: string; type?: string; sizes?: string; title?: string };
export type HeadScript = { type?: string; children?: string; src?: string };
export type HeadResult = { meta: HeadMeta[]; links: HeadLink[]; scripts: HeadScript[] };

export type HeadInput = {
  title: string;
  description?: string | null;
  path: string;
  /** Absolute canonical override (faults). null = omit. */
  canonical?: string | null;
  image?: string;
  ogType?: "website" | "article" | "product";
  noindex?: boolean;
  nodes?: Node[];
  orgId?: string;
  extraScripts?: HeadScript[];
};

/** "X | The Nut Shop" unless that runs past 60 chars. */
export const pageTitle = (t: string): string =>
  `${t} | ${SITE.name}`.length <= 60 ? `${t} | ${SITE.name}` : t;

export function buildHead(i: HeadInput): HeadResult {
  const canonical = i.canonical === undefined ? url(i.path) : i.canonical;
  const image = i.image ?? url("/og/home.png");
  const meta: HeadMeta[] = [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: i.title },
    { name: "theme-color", content: "#FBF4E6" },
  ];
  if (i.description) meta.push({ name: "description", content: i.description });
  meta.push({
    name: "robots",
    content: i.noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
  });
  meta.push(
    { property: "og:site_name", content: SITE.name },
    { property: "og:type", content: i.ogType ?? "website" },
    { property: "og:title", content: i.title },
    ...(i.description ? [{ property: "og:description", content: i.description }] : []),
    { property: "og:url", content: url(i.path) },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: i.title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: i.title },
    ...(i.description ? [{ name: "twitter:description", content: i.description }] : []),
    { name: "twitter:image", content: image },
  );
  const links: HeadLink[] = [
    ...(canonical ? [{ rel: "canonical", href: canonical }] : []),
    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    { rel: "manifest", href: "/site.webmanifest" },
    {
      rel: "alternate",
      type: "application/rss+xml",
      href: "/blog/rss.xml",
      title: `${SITE.name} journal`,
    },
  ];
  // Noindex pages carry no structured data (it would conflict with the noindex).
  const scripts: HeadScript[] = i.noindex
    ? []
    : [{ type: "application/ld+json", children: graph(i.path, i.nodes ?? [], { orgId: i.orgId }) }];
  if (fault("slow-blocking-script") && i.path === "/") scripts.push({ src: "/_fault/slow.js" });
  scripts.push(...(i.extraScripts ?? []));
  return { meta, links, scripts };
}

export const homeHead = (): HeadResult =>
  buildHead({
    title: "The Nut Shop: nuts, nut butters, trail mixes, gift boxes",
    description:
      "A demo shop for nuts, nut butters, trail mixes and gift boxes, with a journal of roasting, storage and baking guides. Nothing here is for sale.",
    path: "/",
    nodes: [webPageNode("/", SITE.name, SITE.tagline)],
  });

export const shopHead = (): HeadResult =>
  buildHead({
    title: pageTitle("All products: nuts, butters and mixes"),
    description:
      "Every nut, nut butter, trail mix, baking nut and gift box in The Nut Shop demo catalogue, grouped by category. Nothing here is for sale.",
    path: "/shop",
    nodes: [
      webPageNode("/shop", "All products", "The full demo catalogue."),
      breadcrumbNode("/shop", [
        { name: "Home", path: "/" },
        { name: "Products", path: "/shop" },
      ]),
    ],
  });

export function categoryHead(c: Category): HeadResult {
  const path = `/categories/${c.slug}`;
  const noDesc = fault("meta-description-missing-category") && c.slug === "raw-nuts";
  return buildHead({
    title: pageTitle(c.seoTitle),
    description: noDesc ? null : c.metaDescription,
    path,
    image: url(`/og/categories-${c.slug}.png`),
    nodes: [webPageNode(path, c.name, c.metaDescription), breadcrumbNode(path, categoryCrumbs(c))],
  });
}

export const categoryCrumbs = (c: Category): Crumb[] => [
  { name: "Home", path: "/" },
  { name: "Products", path: "/shop" },
  { name: c.name, path: `/categories/${c.slug}` },
];
export const productCrumbs = (p: Product): Crumb[] => {
  const c = CATEGORIES.find((x) => x.slug === p.category)!;
  return [...categoryCrumbs(c), { name: p.name, path: `/products/${p.slug}` }];
};
export const postCrumbs = (p: Post): Crumb[] => [
  { name: "Home", path: "/" },
  { name: "Journal", path: "/blog" },
  { name: p.title, path: `/blog/${p.slug}` },
];

export function productTitle(p: Product): string {
  if (fault("title-duplicate") && (p.slug === "raw-almonds" || p.slug === "dry-roasted-almonds"))
    return pageTitle("Almonds: raw and roasted");
  return pageTitle(
    `${p.name}: ${CATEGORIES.find((c) => c.slug === p.category)!.name.toLowerCase()}`,
  );
}

export function productHead(p: Product): HeadResult {
  const path = `/products/${p.slug}`;
  let canonical: string | null | undefined;
  if (fault("canonical-missing") && p.slug === "raw-cashews") canonical = null;
  if (fault("canonical-wrong-home") && p.slug === "raw-walnut-halves") canonical = url("/");
  return buildHead({
    title: productTitle(p),
    description: p.metaDescription,
    path,
    canonical,
    image: url(`/og/products-${p.slug}.png`),
    ogType: "product",
    noindex: fault("noindex-product") && p.slug === "raw-pecan-halves",
    nodes: [
      webPageNode(path, p.name, p.metaDescription),
      breadcrumbNode(path, productCrumbs(p)),
      productNode(p),
    ],
    extraScripts:
      fault("leaked-secret-fake") && p.slug === LEAK_PAGE_SLUG
        ? [{ children: leakedConfigScript() }, { src: "/_fault/shop-config.js" }]
        : [],
  });
}

export const blogIndexHead = (): HeadResult =>
  buildHead({
    title: pageTitle("Journal: nut guides, recipes, explainers"),
    description:
      "Roasting guides, storage tips, baking recipes and explainers about nuts from The Nut Shop journal, written for the demo store.",
    path: "/blog",
    nodes: [
      webPageNode("/blog", "Journal", "Guides, recipes and explainers."),
      breadcrumbNode("/blog", [
        { name: "Home", path: "/" },
        { name: "Journal", path: "/blog" },
      ]),
    ],
  });

export const postHead = (post: Post): HeadResult =>
  buildHead({
    title: pageTitle(post.title),
    description: post.description,
    path: `/blog/${post.slug}`,
    image: url(`/og/posts-${post.slug}.png`),
    ogType: "article",
    nodes: [
      webPageNode(`/blog/${post.slug}`, post.title, post.description),
      breadcrumbNode(`/blog/${post.slug}`, postCrumbs(post)),
      articleNode(post),
    ],
  });

export function staticHead(page: StaticPage, extra: Node[] = []): HeadResult {
  const orgId =
    page.path === "/about" && fault("jsonld-id-conflict") ? `${SITE.baseUrl}/#website` : undefined;
  return buildHead({
    title: pageTitle(page.title),
    description: page.description,
    path: page.path,
    orgId,
    nodes: [
      webPageNode(page.path, page.title, page.description),
      breadcrumbNode(page.path, [
        { name: "Home", path: "/" },
        { name: page.h1, path: page.path },
      ]),
      ...extra,
    ],
  });
}

export const faqHead = (): HeadResult =>
  buildHead({
    title: pageTitle("FAQ: demo store, cart, allergens, storage"),
    description:
      "Answers about The Nut Shop demo store: what is for sale (nothing), how the cart works, privacy, allergens and how to store nuts.",
    path: "/faq",
    nodes: [
      webPageNode("/faq", "FAQ", "Frequently asked questions."),
      breadcrumbNode("/faq", [
        { name: "Home", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]),
      faqNode("/faq"),
    ],
  });

export const noindexHead = (
  title: string,
  path: string,
  description = "Demo store page. Not for indexing.",
): HeadResult =>
  buildHead({
    title: pageTitle(title),
    description,
    path,
    noindex: true,
  });

export const notFoundHead = (): HeadResult =>
  buildHead({
    title: pageTitle("Page not found"),
    description: "The page you were looking for does not exist.",
    path: "/404",
    canonical: null,
    noindex: true,
  });

export { STATIC_PAGES };
