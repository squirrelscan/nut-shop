import { url } from "#/config/site";
import { priceNumber } from "#/lib/format";
import { breadcrumbNode, webPageNode, type Crumb, type Node } from "#/seo/jsonld";
import { buildHead, pageTitle, type HeadResult } from "#/seo/head";
import {
  CATALOGUE_SIZE,
  PAGE_COUNT,
  itemPath,
  listingPath,
  pageOf,
  type CatalogueItem,
} from "./generate";

// buildHead only consults faults for "/" (slow-blocking-script), so these heads are fault-free.

export const listingCrumbs = (n: number): Crumb[] => [
  { name: "Home", path: "/" },
  { name: "Catalogue", path: listingPath(1) },
  ...(n > 1 ? [{ name: `Page ${n}`, path: listingPath(n) }] : []),
];

export const itemCrumbs = (item: CatalogueItem): Crumb[] => [
  ...listingCrumbs(pageOf(item)),
  { name: item.name, path: itemPath(item) },
];

export function listingHead(n: number): HeadResult {
  const path = listingPath(n);
  const title =
    n === 1
      ? pageTitle("Catalogue: every nut we have imagined")
      : pageTitle(`Catalogue, page ${n} of ${PAGE_COUNT}`);
  const description =
    n === 1
      ? `The full demo catalogue: ${CATALOGUE_SIZE.toLocaleString("en")} imaginary nut products from fictional growers, generated from a fixed seed. Nothing here is for sale.`
      : `Page ${n} of ${PAGE_COUNT} in The Nut Shop demo catalogue of ${CATALOGUE_SIZE.toLocaleString("en")} imaginary nut products. Nothing here is for sale.`;
  return buildHead({
    title,
    description,
    path,
    nodes: [webPageNode(path, title, description), breadcrumbNode(path, listingCrumbs(n))],
  });
}

function itemNode(item: CatalogueItem): Node {
  const path = itemPath(item);
  return {
    "@type": "Product",
    "@id": `${url(path)}#product`,
    name: item.name,
    sku: item.sku,
    description: item.metaDescription,
    image: url(`/img/products/${item.image}.svg`),
    brand: { "@type": "Brand", name: "The Nut Shop (demo)" },
    offers: {
      "@type": "Offer",
      url: url(path),
      priceCurrency: "USD",
      price: priceNumber(item.fromCents),
      availability: "https://schema.org/InStock",
    },
  };
}

export function itemHead(item: CatalogueItem): HeadResult {
  const path = itemPath(item);
  return buildHead({
    title: pageTitle(item.name),
    description: item.metaDescription,
    path,
    image: url("/og/home.png"),
    ogType: "product",
    nodes: [
      webPageNode(path, item.name, item.metaDescription),
      breadcrumbNode(path, itemCrumbs(item)),
      itemNode(item),
    ],
  });
}
