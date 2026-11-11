import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { SITE } from "#/config/site";
import { faultRoute } from "#/server/fault-routes";
import { finalize } from "#/server/headers";
import { applyIndexing, parseIndexingMode } from "#/server/indexing";

const start = createStartHandler({ handler: defaultStreamHandler });

type Env = { INDEXING?: string; ASSETS?: { fetch: (request: Request) => Promise<Response> } };

const isLocal = (host: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || host.endsWith(".localhost");

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);
    const mode = parseIndexingMode(env.INDEXING);
    const ua = request.headers.get("user-agent");
    // Plain http must 301 to https (the Cloudflare zone setting is primary; this is the fallback).
    const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    if (proto === "http" && !isLocal(url.host)) {
      url.protocol = "https:";
      const headers = new Headers({ Location: url.toString() });
      applyIndexing(headers, mode, ua);
      return new Response(null, { status: 301, headers });
    }
    // Static files (public/, build assets) go through the Worker too (assets.run_worker_first)
    // so they carry the same X-Robots-Tag. Fall through to the app on a miss.
    if (env.ASSETS && request.method === "GET" && !url.pathname.startsWith("/_fault/")) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        const headers = new Headers(asset.headers);
        applyIndexing(headers, mode, ua);
        return new Response(asset.body, {
          status: asset.status,
          statusText: asset.statusText,
          headers,
        });
      }
    }
    const response = (await faultRoute(request)) ?? (await start(request));
    return finalize(request, response, new Date(`${SITE.buildDate}T00:00:00Z`).toUTCString(), mode);
  },
};
