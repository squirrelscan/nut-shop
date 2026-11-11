import { createFileRoute } from "@tanstack/react-router";
import { robotsTxt } from "#/seo/sitemap";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(robotsTxt(), { headers: { "content-type": "text/plain; charset=utf-8" } }),
    },
  },
});
