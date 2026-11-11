/**
 * INDEXING setting (Worker var, see wrangler.jsonc).
 *
 * This only ever makes the site LESS indexable to third parties. It is not
 * cloaking for ranking: no search engine or unknown bot is ever shown anything
 * more indexable than the default.
 *
 *  - off          X-Robots-Tag: noindex, nofollow on every response.
 *  - auditor-only (default) the same header for every client EXCEPT the
 *                 squirrelscan audit crawler, so the demo audit sees an
 *                 indexable shop. Exempt when ANY of: User-Agent starts with
 *                 "SquirrelScan/" (CLI), User-Agent starts with
 *                 "squirrel-cloud-audit" (cloud plain fetch), or the request
 *                 carries "X-Squirrel-Audit: nutshop-demo" (cloud renders use a
 *                 normal Chrome UA; the marker is not a secret).
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

export const AUDITOR_UA_PREFIXES = [AUDITOR_UA_PREFIX, "squirrel-cloud-audit"] as const;
export const AUDIT_MARKER_HEADER = "X-Squirrel-Audit";
export const AUDIT_MARKER_VALUE = "nutshop-demo";

export const isAuditor = (userAgent: string | null, marker: string | null = null): boolean =>
  AUDITOR_UA_PREFIXES.some((p) => (userAgent ?? "").startsWith(p)) || marker === AUDIT_MARKER_VALUE;

/** Value for X-Robots-Tag, or null when the response should carry none. */
export function robotsTag(
  mode: IndexingMode,
  userAgent: string | null,
  marker: string | null = null,
): string | null {
  if (mode === "on") return null;
  if (mode === "auditor-only" && isAuditor(userAgent, marker)) return null;
  return NOINDEX_VALUE;
}

/** Sets X-Robots-Tag (and Vary: User-Agent when the answer depends on it). */
export function applyIndexing(
  headers: Headers,
  mode: IndexingMode,
  userAgent: string | null,
  marker: string | null = null,
): void {
  const tag = robotsTag(mode, userAgent, marker);
  if (tag) headers.set("X-Robots-Tag", tag);
  else headers.delete("X-Robots-Tag");
  if (mode === "auditor-only") {
    let vary = headers.get("Vary") ?? "";
    for (const name of ["User-Agent", AUDIT_MARKER_HEADER]) {
      if (!new RegExp(`(^|,)\\s*${name}\\s*(,|$)`, "i").test(vary))
        vary = vary ? `${vary}, ${name}` : name;
    }
    headers.set("Vary", vary);
  }
}
