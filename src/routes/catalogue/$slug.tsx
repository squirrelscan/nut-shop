import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCatalogueItem } from "#/catalogue/generate";
import { CatalogueItemPage } from "#/catalogue/pages";
import { itemHead } from "#/catalogue/head";

// Generated from the seed at request time (no prebuilt pages), so the Worker stays small.
export const Route = createFileRoute("/catalogue/$slug")({
  loader: ({ params }) => {
    if (!getCatalogueItem(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => (loaderData ? itemHead(getCatalogueItem(loaderData.slug)!) : {}),
  component: Component,
});

function Component() {
  const { slug } = Route.useLoaderData();
  return <CatalogueItemPage item={getCatalogueItem(slug)!} />;
}
