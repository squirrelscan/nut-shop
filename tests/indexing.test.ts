import { describe, expect, test } from "bun:test";
import { withFaults } from "../faults/runtime";
import { finalize } from "#/server/headers";
import { robotsTag, parseIndexingMode, type IndexingMode } from "#/server/indexing";
import { robotsTxt } from "#/seo/sitemap";
import { metaContent, product } from "./helpers";
import { productHead } from "#/seo/head";

const AUDITOR = "SquirrelScan/2.0 (+https://squirrelscan.com)";
const GOOGLE = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BROWSER = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36";

const send = async (mode: IndexingMode, ua: string | null, marker?: string) => {
  const h: Record<string, string> = {};
  if (ua) h["user-agent"] = ua;
  if (marker) h["x-squirrel-audit"] = marker;
  const req = new Request("https://nutshop.squirrelscan.com/about", { headers: h });
  const res = new Response("<html></html>", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
  return finalize(req, res, "x", mode);
};

describe("INDEXING modes", () => {
  test("off: noindex for everyone, including the auditor", async () => {
    for (const ua of [AUDITOR, GOOGLE, BROWSER, null]) {
      expect((await send("off", ua)).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });

  test("auditor-only: noindex for everyone except SquirrelScan/", async () => {
    for (const ua of [GOOGLE, BROWSER, null, "NotSquirrelScan/2.0", "squirrelscan/2.0"]) {
      expect((await send("auditor-only", ua)).headers.get("x-robots-tag"), String(ua)).toBe(
        "noindex, nofollow",
      );
    }
    expect((await send("auditor-only", AUDITOR)).headers.get("x-robots-tag")).toBeNull();
    expect((await send("auditor-only", "SquirrelScan/9.9")).headers.get("x-robots-tag")).toBeNull();
  });

  test("auditor-only varies on User-Agent; the other modes do not", async () => {
    expect((await send("auditor-only", AUDITOR)).headers.get("vary")).toContain("User-Agent");
    expect((await send("off", GOOGLE)).headers.get("vary") ?? "").not.toContain("User-Agent");
  });

  test("on: no X-Robots-Tag for anyone", async () => {
    for (const ua of [AUDITOR, GOOGLE, BROWSER, null]) {
      expect((await send("on", ua)).headers.get("x-robots-tag")).toBeNull();
    }
  });

  test("default and unknown values fall back to auditor-only", () => {
    expect(parseIndexingMode(undefined)).toBe("auditor-only");
    expect(parseIndexingMode("")).toBe("auditor-only");
    expect(parseIndexingMode("yes")).toBe("auditor-only");
    expect(parseIndexingMode("off")).toBe("off");
    expect(parseIndexingMode("on")).toBe("on");
  });

  test("never more indexable to third parties than the default", () => {
    for (const mode of ["off", "auditor-only"] as const)
      expect(robotsTag(mode, GOOGLE)).not.toBeNull();
  });

  test("a 304 and a 301 also carry the header", async () => {
    const res = await finalize(
      new Request("https://x.test/a", { headers: { "user-agent": GOOGLE } }),
      new Response("", { status: 404, headers: { "content-type": "text/html" } }),
      "x",
      "auditor-only",
    );
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  test("robots.txt stays permissive in every mode (no Disallow: /)", () => {
    expect(robotsTxt()).not.toMatch(/^Disallow:/m);
    expect(robotsTxt()).toContain("Allow: /");
  });

  test("noindex-product fault still works on top of the auditor-visible state", async () => {
    const off = withFaults([], () =>
      metaContent(productHead(product("raw-pecan-halves")), "name", "robots"),
    );
    const on = withFaults(["noindex-product"], () =>
      metaContent(productHead(product("raw-pecan-halves")), "name", "robots"),
    );
    expect(off).not.toContain("noindex");
    expect(on).toContain("noindex");
    // The auditor gets no header, so the meta tag is the only noindex it sees.
    expect((await send("auditor-only", AUDITOR)).headers.get("x-robots-tag")).toBeNull();
  });

  test("cloud auditor: squirrel-cloud-audit UA is exempt", async () => {
    expect(
      (await send("auditor-only", "squirrel-cloud-audit")).headers.get("x-robots-tag"),
    ).toBeNull();
    expect(
      (await send("auditor-only", "squirrel-cloud-audit/1.2")).headers.get("x-robots-tag"),
    ).toBeNull();
    expect(
      (await send("auditor-only", "my-squirrel-cloud-audit")).headers.get("x-robots-tag"),
    ).toBe("noindex, nofollow");
  });

  test("marker header: a browser UA with X-Squirrel-Audit: nutshop-demo is exempt", async () => {
    expect(
      (await send("auditor-only", BROWSER, "nutshop-demo")).headers.get("x-robots-tag"),
    ).toBeNull();
  });

  test("browser UA without the marker, or with a wrong value, gets noindex", async () => {
    expect((await send("auditor-only", BROWSER)).headers.get("x-robots-tag")).toBe(
      "noindex, nofollow",
    );
    expect((await send("auditor-only", BROWSER, "other")).headers.get("x-robots-tag")).toBe(
      "noindex, nofollow",
    );
  });

  test("off still wins over UA and marker; on ignores them", async () => {
    expect((await send("off", AUDITOR, "nutshop-demo")).headers.get("x-robots-tag")).toBe(
      "noindex, nofollow",
    );
    expect((await send("on", BROWSER)).headers.get("x-robots-tag")).toBeNull();
  });

  test("Vary lists User-Agent and X-Squirrel-Audit in auditor-only", async () => {
    const v = (await send("auditor-only", BROWSER)).headers.get("vary") ?? "";
    expect(v).toContain("User-Agent");
    expect(v).toContain("X-Squirrel-Audit");
  });
});
