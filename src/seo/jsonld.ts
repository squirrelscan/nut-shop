import { SITE, url } from "#/config/site";
import { fault } from "../../faults/runtime";
import type { Post, Product } from "#/content/types";
import { priceNumber } from "#/lib/format";
import { FAQ } from "#/content/pages";

export type Node = Record<string, unknown>;
export type Crumb = { name: string; path: string };

export const ids = {
  org: () => `${SITE.baseUrl}/#organization`,
  site: () => `${SITE.baseUrl}/#website`,
  page: (path: string) => `${url(path)}#webpage`,
  crumbs: (path: string) => `${url(path)}#breadcrumb`,
  product: (slug: string) => `${url(`/products/${slug}`)}#product`,
  post: (slug: string) => `${url(`/blog/${slug}`)}#article`,
};

export const organizationNode = (idOverride?: string): Node => ({
  "@type": "Organization",
  "@id": idOverride ?? ids.org(),
  name: SITE.name,
  url: url("/"),
  logo: { "@type": "ImageObject", url: url("/logo.png"), width: 512, height: 512 },
  email: SITE.contactEmail,
  description: `${SITE.name} is a fictional demo shop for nuts, nut butters, trail mixes and gift boxes, run to test website audits.`,
});

export const websiteNode = (): Node => ({
  "@type": "WebSite",
  "@id": ids.site(),
  url: url("/"),
  name: SITE.name,
  inLanguage: SITE.locale,
  publisher: { "@id": ids.org() },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE.baseUrl}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbNode = (path: string, crumbs: Crumb[]): Node => ({
  "@type": "BreadcrumbList",
  "@id": ids.crumbs(path),
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: url(c.path),
  })),
});

export function productNode(p: Product): Node {
  const path = `/products/${p.slug}`;
  const breakPrice = fault("jsonld-product-invalid") && p.slug === "smooth-peanut-butter";
  return {
    "@type": "Product",
    "@id": ids.product(p.slug),
    name: p.name,
    description: p.metaDescription,
    sku: p.slug,
    image: [url(`/og/products-${p.slug}.png`)],
    url: url(path),
    brand: { "@type": "Brand", name: SITE.name },
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: `${p.slug}-${v.weightG}g`,
      name: `${p.name}, ${v.label}`,
      ...(breakPrice ? {} : { price: priceNumber(v.priceCents) }),
      priceCurrency: SITE.currency,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: url(path),
      seller: { "@id": ids.org() },
    })),
  };
}

export const articleNode = (post: Post): Node => ({
  "@type": "BlogPosting",
  "@id": ids.post(post.slug),
  headline: post.title,
  description: post.description,
  image: [url(`/og/posts-${post.slug}.png`)],
  datePublished: post.date,
  dateModified: post.date,
  author: { "@id": ids.org() },
  publisher: { "@id": ids.org() },
  mainEntityOfPage: { "@type": "WebPage", "@id": url(`/blog/${post.slug}`) },
  inLanguage: SITE.locale,
  wordCount: post.words,
});

export const faqNode = (path: string): Node => ({
  "@type": "FAQPage",
  "@id": `${url(path)}#faq`,
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const webPageNode = (path: string, name: string, description: string): Node => ({
  "@type": "WebPage",
  "@id": ids.page(path),
  url: url(path),
  name,
  description,
  isPartOf: { "@id": ids.site() },
  inLanguage: SITE.locale,
});

/** One @graph per page. Org and WebSite are identical on every page (same @id). */
export function graph(_path: string, extra: Node[], opts: { orgId?: string } = {}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [organizationNode(opts.orgId), websiteNode(), ...extra],
  });
}
