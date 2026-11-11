import { createFileRoute } from "@tanstack/react-router";
import { ShopPage } from "#/pages/shop";
import { shopHead } from "#/seo/head";

export const Route = createFileRoute("/shop")({ head: () => shopHead(), component: ShopPage });
