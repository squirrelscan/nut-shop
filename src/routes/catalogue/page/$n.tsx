import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGE_COUNT } from "#/catalogue/generate";
import { CatalogueListingPage } from "#/catalogue/pages";
import { listingHead } from "#/catalogue/head";

export const Route = createFileRoute("/catalogue/page/$n")({
  loader: ({ params }) => {
    // Page 1 lives at /catalogue only; "02" or "1" here would duplicate a listing.
    const n = Number(params.n);
    if (!/^[1-9]\d*$/.test(params.n) || n < 2 || n > PAGE_COUNT) throw notFound();
    return { n };
  },
  head: ({ loaderData }) => (loaderData ? listingHead(loaderData.n) : {}),
  component: Component,
});

function Component() {
  const { n } = Route.useLoaderData();
  return <CatalogueListingPage page={n} />;
}
