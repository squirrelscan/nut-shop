/**
 * INDEXING setting (Worker var, see wrangler.jsonc).
 *
 * This only ever makes the site LESS indexable to third parties. It is not
 * cloaking for ranking: no search engine or unknown bot is ever shown anything
 * more indexable than the default.
 *
 *  - off          X-Robots-Tag: noindex, nofollow on every response.
 *  - auditor-only (default) the same header for every client EXCEPT the
 *                 squirrelscan audit crawler (User-Agent starts with
 *                 "SquirrelScan/"), so the demo audit sees an indexable shop.
 *  - on           no X-Robots-Tag header.
 *
 * robots.txt stays permissive in every mode: a Disallow would stop the audit
 * and does not prevent indexing anyway.
 */
export type IndexingMode = "off" | "auditor-only" | "on";

export const AUDITOR_UA_PREFIX = "SquirrelScan/";
export const NOINDEX_VALUE = "noindex, nofollow";

export function parseIndexingMode(value: unknown): IndexingMode {
  return value === "off" || value === "on" || value === "auditor-only" ? value : "auditor-only";
}

export const isAuditor = (userAgent: string | null): boolean =>
  (userAgent ?? "").startsWith(AUDITOR_UA_PREFIX);

/** Value for X-Robots-Tag, or null when the response should carry none. */
export function robotsTag(mode: IndexingMode, userAgent: string | null): string | null {
  if (mode === "on") return null;
  if (mode === "auditor-only" && isAuditor(userAgent)) return null;
  return NOINDEX_VALUE;
}

/** Sets X-Robots-Tag (and Vary: User-Agent when the answer depends on it). */
export function applyIndexing(
  headers: Headers,
  mode: IndexingMode,
  userAgent: string | null,
): void {
  const tag = robotsTag(mode, userAgent);
  if (tag) headers.set("X-Robots-Tag", tag);
  else headers.delete("X-Robots-Tag");
  if (mode === "auditor-only") {
    const vary = headers.get("Vary");
    if (!vary || !/\buser-agent\b/i.test(vary))
      headers.set("Vary", vary ? `${vary}, User-Agent` : "User-Agent");
  }
}
