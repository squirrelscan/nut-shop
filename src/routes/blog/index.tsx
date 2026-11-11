import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexPage } from "#/pages/content";
import { blogIndexHead } from "#/seo/head";

export const Route = createFileRoute("/blog/")({
  head: () => blogIndexHead(),
  component: BlogIndexPage,
});
