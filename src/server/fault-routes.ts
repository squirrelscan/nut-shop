import { fault } from "../../faults/runtime";
import { leakedConfigAsset } from "#/seo/fake-secret";
import { SITE } from "#/config/site";

/** Endpoints under /_fault/. They exist in every state (shop-config.js only while its fault is on); faults mostly decide whether anything links to them. */
export function faultRoute(request: Request): Response | Promise<Response> | null {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/_fault/")) return null;
  const to = (p: string) => new Response(null, { status: 301, headers: { Location: p } });
  switch (pathname) {
    case "/_fault/gone":
      return new Response("Gone. This page was removed on purpose.\n", {
        status: 410,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    case "/_fault/r1":
      return to("/_fault/r2");
    case "/_fault/r2":
      return to("/_fault/r3");
    case "/_fault/r3":
      return to("/categories/gift-boxes");
    case "/_fault/soft-404":
      return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page not found | ${SITE.name}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>Page not found</h1><p>Sorry, we could not find that page. It may have moved or never existed.</p><p><a href="/">Back to the home page</a></p></main></body></html>`,
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    case "/_fault/slow.js":
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve(
              new Response("/* deliberately slow */\n", {
                status: 200,
                headers: { "content-type": "text/javascript; charset=utf-8" },
              }),
            ),
          2500,
        ),
      );
    case "/_fault/shop-config.js":
      // Only exists while the fault is on; otherwise a plain 404.
      return fault("leaked-secret-fake")
        ? new Response(leakedConfigAsset(), {
            status: 200,
            headers: { "content-type": "text/javascript; charset=utf-8" },
          })
        : new Response("Not found\n", { status: 404 });
    case "/_fault/big-image.svg":
      return new Response(bigSvg(), { status: 200, headers: { "content-type": "image/svg+xml" } });
    default:
      return new Response("Not found\n", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
  }
}

/** About 2.5 MB of deterministic SVG noise: a stand-in for an unoptimised hero photo. */
export function bigSvg(): string {
  let a = 12345;
  const r = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
  const parts: string[] = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="#f3e6cf"/>',
  ];
  for (let i = 0; i < 24000; i++) {
    const x = (r() * 1200).toFixed(2);
    const y = (r() * 600).toFixed(2);
    parts.push(
      `<path d="M${x} ${y}c${(r() * 40 - 20).toFixed(3)} ${(r() * 40 - 20).toFixed(3)} ${(r() * 40 - 20).toFixed(3)} ${(r() * 40 - 20).toFixed(3)} ${(r() * 40).toFixed(3)} ${(r() * 40).toFixed(3)}z" fill="hsl(${(25 + r() * 20).toFixed(0)} ${(40 + r() * 30).toFixed(0)}% ${(30 + r() * 40).toFixed(0)}%)" opacity="${r().toFixed(3)}"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}
