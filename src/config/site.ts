/**
 * The ONE place to set the site identity. The hostname is injected at build
 * time with VITE_SITE_URL (defaults to the local dev address).
 */
const rawUrl = (import.meta.env?.VITE_SITE_URL as string | undefined) ?? "http://127.0.0.1:4210";

export const SITE = {
  name: "The Nut Shop",
  baseUrl: rawUrl.replace(/\/+$/, ""),
  host: new URL(rawUrl).host,
  contactEmail: `hello@${new URL(rawUrl).hostname}`,
  currency: "USD",
  locale: "en",
  tagline: "Nuts, nut butters, trail mixes and gift boxes",
  demoNotice:
    "The Nut Shop is a demo store run by squirrelscan to test website audits. Nothing here is for sale.",
  business: {
    legalName: "Demo Nut Trading Co (fictional)",
    registration: "Not a real company. No registration number exists.",
    address: "No physical address. This is a demo.",
  },
  // Fixed so rendered output is deterministic.
  buildDate: "2026-11-11",
} as const;

export const url = (path: string): string => `${SITE.baseUrl}${path === "/" ? "/" : path}`;
