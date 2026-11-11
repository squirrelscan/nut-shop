import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { getCategory, getPost, getProduct } from "#/content";
import { STATIC_PAGES } from "#/content/pages";
import { CategoryPage, HomePage, ProductPage, ShopPage } from "#/pages/shop";
import { BlogIndexPage, FaqPage, PostPage, StaticPageView } from "#/pages/content";
import { Footer } from "#/components/layout";
import type { HeadResult } from "#/seo/head";

export const html = (el: ReactElement): string => renderToStaticMarkup(el);
export const product = (slug: string) => getProduct(slug)!;
export const post = (slug: string) => getPost(slug)!;
export const category = (slug: string) => getCategory(slug)!;

export const pages = {
  home: () => html(<HomePage />),
  shop: () => html(<ShopPage />),
  category: (s: string) => html(<CategoryPage category={category(s)} />),
  product: (s: string) => html(<ProductPage product={product(s)} />),
  blog: () => html(<BlogIndexPage />),
  post: (s: string) => html(<PostPage post={post(s)} />),
  staticPage: (k: keyof typeof STATIC_PAGES) => html(<StaticPageView page={STATIC_PAGES[k]} />),
  faq: () => html(<FaqPage />),
  footer: () => html(<Footer />),
};

export const ldGraph = (
  h: HeadResult,
): { "@type": string; "@id": string; [k: string]: unknown }[] =>
  JSON.parse(h.scripts.find((s) => s.type === "application/ld+json")!.children!)["@graph"];
export const metaContent = (
  h: HeadResult,
  key: "name" | "property",
  value: string,
): string | undefined => h.meta.find((m) => m[key] === value)?.content;
export const canonicalOf = (h: HeadResult): string | undefined =>
  h.links.find((l) => l.rel === "canonical")?.href;
export const titleOf = (h: HeadResult): string | undefined =>
  h.meta.find((m) => "title" in m)?.title;
