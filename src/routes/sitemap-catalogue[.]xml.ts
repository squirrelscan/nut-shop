import { createFileRoute } from "@tanstack/react-router";
import { catalogueSitemapXml } from "#/catalogue/sitemap";

export const Route = createFileRoute("/sitemap-catalogue.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(catalogueSitemapXml(), {
          headers: { "content-type": "application/xml; charset=utf-8" },
        }),
    },
  },
});
