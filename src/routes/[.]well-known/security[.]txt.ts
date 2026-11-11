import { createFileRoute } from "@tanstack/react-router";
import { securityTxt } from "#/seo/sitemap";

export const Route = createFileRoute("/.well-known/security.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(securityTxt(), { headers: { "content-type": "text/plain; charset=utf-8" } }),
    },
  },
});
