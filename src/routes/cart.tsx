import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "#/pages/misc";
import { noindexHead } from "#/seo/head";

export const Route = createFileRoute("/cart")({
  head: () =>
    noindexHead(
      "Your cart: demo basket",
      "/cart",
      "Your demo basket at The Nut Shop. The cart is kept in your browser only, and no order can be placed because nothing here is for sale.",
    ),
  component: CartPage,
});
