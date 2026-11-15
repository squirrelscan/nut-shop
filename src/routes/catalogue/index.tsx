import { createFileRoute } from "@tanstack/react-router";
import { CatalogueListingPage } from "#/catalogue/pages";
import { listingHead } from "#/catalogue/head";

export const Route = createFileRoute("/catalogue/")({
  head: () => listingHead(1),
  component: () => <CatalogueListingPage page={1} />,
});
