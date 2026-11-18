import { fault } from "../../faults/runtime";
import type { FaultId } from "../../faults/registry";

/**
 * Third-party script faults. Each loads real vendor URLs with placeholder account ids, so nothing is
 * configured and nothing is tracked: most answer 404 or define an unused global.
 *
 * `fetchOnly` loads are `<link rel="preload" as="script">`: the browser requests the file and never
 * runs it. Used where running the vendor's code on the page is not wanted.
 *
 * While a fault is on, the page's CSP `script-src` gains exactly the origins that fault loads
 * (`thirdPartyScriptOrigins`). `connect-src`, `img-src` and `frame-src` stay as they are, so a script
 * that does run cannot send anything onward.
 */
export type ThirdPartyLoad = {
  src: string;
  /** `<script type="module">`. */
  module?: boolean;
  /** Requested with a preload link, never executed. */
  fetchOnly?: boolean;
};

type Group = { id: FaultId; path: string; loads: readonly ThirdPartyLoad[] };

/** A first-party URL that carries its vendor target in `?url=`, the way a script proxy does. */
export const PROXIED_SCRIPT_PATH = "/_fault/proxy.js";
export const PROXIED_SCRIPT_TARGET = "https://plausible.io/js/script.js";

const s = (src: string): ThirdPartyLoad => ({ src });
const fetchOnly = (src: string): ThirdPartyLoad => ({ src, fetchOnly: true });

const JQUERY_OLD = "https://code.jquery.com/jquery-1.11.3.min.js";

export const THIRD_PARTY_GROUPS: readonly Group[] = [
  {
    id: "third-party-session-replay-on-cart",
    path: "/cart",
    loads: [
      s("https://static.hotjar.com/c/hotjar-0.js?sv=6"),
      s("https://www.clarity.ms/tag/nutshopdemo0"),
      s("https://edge.fullstory.com/s/fs.js"),
    ],
  },
  {
    id: "third-party-tag-managers-on-cart",
    path: "/cart",
    loads: [
      s("https://www.googletagmanager.com/gtm.js?id=GTM-NUTSHOP0"),
      s("https://assets.adobedtm.com/nutshopdemo0/launch-000000000000.min.js"),
    ],
  },
  {
    id: "third-party-ab-test-on-cart",
    path: "/cart",
    loads: [s("https://cdn.optimizely.com/js/1000000000.js")],
  },
  {
    id: "third-party-ad-and-tracking-vendors-on-cart",
    path: "/cart",
    loads: [
      fetchOnly("https://hm.baidu.com/hm.js?0"),
      fetchOnly("https://platform-api.sharethis.com/js/sharethis.js"),
      fetchOnly("https://c.amazon-adsystem.com/aax2/apstag.js"),
      fetchOnly("https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=NUTSHOPDEMO0"),
    ],
  },
  {
    id: "third-party-vulnerable-libraries-on-cart",
    path: "/cart",
    loads: [
      s(JQUERY_OLD),
      s("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"),
      s("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min.js"),
    ],
  },
  {
    id: "third-party-conflicting-library-versions-on-cart",
    path: "/cart",
    loads: [s(JQUERY_OLD), s("https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js")],
  },
  {
    id: "third-party-vendor-sprawl-home",
    path: "/",
    loads: [
      s("https://www.googletagmanager.com/gtag/js?id=G-NUTSHOP000"),
      s("https://connect.facebook.net/en_US/fbevents.js"),
      s("https://bat.bing.com/bat.js"),
      s("https://s.pinimg.com/ct/core.js"),
      s("https://www.redditstatic.com/ads/pixel.js"),
      s("https://static.ads-twitter.com/uwt.js"),
      s("https://js.hs-scripts.com/0.js"),
      s("https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=NUTSHP"),
      s("https://widget.intercom.io/widget/nutshopdemo0"),
      s("https://static.zdassets.com/ekr/snippet.js?key=00000000-0000-0000-0000-000000000000"),
      s("https://client.crisp.chat/l.js"),
      s("https://code.tidio.co/nutshopdemo0.js"),
      s("https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"),
      s("https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz"),
      s("https://us-assets.i.posthog.com/static/array.js"),
      s("https://cdn.usefathom.com/script.js"),
      s("https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"),
      s("https://consent.cookiebot.com/uc.js"),
      s("https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"),
      s("https://chimpstatic.com/mcjs-connected/js/users/0/0.js"),
      s("https://assets.calendly.com/assets/external/widget.js"),
      s("https://browser.sentry-cdn.com/8.0.0/bundle.min.js"),
      s("https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js"),
      s("https://js.stripe.com/v3/"),
      s("https://www.paypal.com/sdk/js?client-id=sb"),
      s("https://fast.wistia.com/assets/external/E-v1.js"),
      s("https://player.vimeo.com/api/player.js"),
      s("https://static.addtoany.com/menu/page.js"),
    ],
  },
  {
    id: "third-party-proxied-script-home",
    path: "/",
    loads: [s(`${PROXIED_SCRIPT_PATH}?url=${encodeURIComponent(PROXIED_SCRIPT_TARGET)}`)],
  },
  {
    id: "third-party-unknown-host-script-home",
    path: "/",
    loads: [{ src: "https://esm.sh/is-number@7.0.0", module: true }],
  },
  {
    id: "third-party-reported-compromised-vendor-home",
    path: "/",
    loads: [fetchOnly("https://cdn.debugbear.com/nutshopdemo0.js")],
  },
  {
    id: "third-party-new-vendor-home",
    path: "/",
    loads: [
      fetchOnly("https://snap.licdn.com/li.lms-analytics/insight.min.js"),
      fetchOnly("https://cloud.umami.is/script.js"),
      fetchOnly("https://cdn.userway.org/widget.js"),
      fetchOnly("https://embed.tawk.to/nutshopdemo0/default"),
    ],
  },
];

/** The existing single-script fault (head.ts loads it); listed here so the CSP lets it through. */
const LEGACY: readonly { id: FaultId; path: string; origin: string }[] = [
  { id: "third-party-script-on-cart", path: "/cart", origin: "https://cdn.jsdelivr.net" },
];

/** Loads for this path from every fault that is on, in registry order, one entry per URL. */
export function thirdPartyLoads(path: string): ThirdPartyLoad[] {
  const seen = new Set<string>();
  const out: ThirdPartyLoad[] = [];
  for (const group of THIRD_PARTY_GROUPS) {
    if (group.path !== path || !fault(group.id)) continue;
    for (const load of group.loads) {
      if (seen.has(load.src)) continue;
      seen.add(load.src);
      out.push(load);
    }
  }
  return out;
}

export type ThirdPartyScriptTag = { src: string; async: true; type?: "module" };
export type ThirdPartyPreloadLink = { rel: "preload"; as: "script"; href: string };

export const thirdPartyScripts = (path: string): ThirdPartyScriptTag[] =>
  thirdPartyLoads(path)
    .filter((l) => !l.fetchOnly)
    .map((l) => ({
      src: l.src,
      async: true as const,
      ...(l.module ? { type: "module" as const } : {}),
    }));

export const thirdPartyPreloads = (path: string): ThirdPartyPreloadLink[] =>
  thirdPartyLoads(path)
    .filter((l) => l.fetchOnly)
    .map((l) => ({ rel: "preload" as const, as: "script" as const, href: l.src }));

/** Origins to add to `script-src` for this path: only what the faults that are on load there. */
export function thirdPartyScriptOrigins(path: string): string[] {
  const origins = new Set<string>();
  for (const load of thirdPartyLoads(path)) {
    if (load.src.startsWith("https://")) origins.add(new URL(load.src).origin);
  }
  for (const legacy of LEGACY)
    if (legacy.path === path && fault(legacy.id)) origins.add(legacy.origin);
  return [...origins].sort();
}
