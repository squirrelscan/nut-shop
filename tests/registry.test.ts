import { describe, expect, test } from "bun:test";
import { FAULTS } from "../faults/registry";

const rulesOf = (f: { expectedRule: string | readonly string[] }): readonly string[] =>
  typeof f.expectedRule === "string" ? [f.expectedRule] : f.expectedRule;

describe("fault registry", () => {
  test("ids are unique", () => {
    const ids = FAULTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every fault expects at least one well-formed rule id", () => {
    for (const f of FAULTS) {
      const rules = rulesOf(f);
      expect(rules.length).toBeGreaterThan(0);
      for (const r of rules) expect(r).toMatch(/^[a-z0-9]+\/[a-z0-9-]+$/);
      expect(new Set(rules).size).toBe(rules.length);
    }
  });

  test("faults verified against audits expect the rules the audits reported", () => {
    const by = Object.fromEntries(FAULTS.map((f) => [f.id, rulesOf(f)]));
    expect(by["image-missing-dimensions"]).toEqual(["images/dimensions", "perf/cls-hints"]);
    expect(by["no-cache-validators"]).toEqual(["perf/bad-caching"]);
    expect(by["html-lang-missing"]).toEqual(["a11y/html-lang-valid", "i18n/lang-attribute"]);
    expect(by["sitemap-lists-404"]).toEqual(["crawl/sitemap-4xx"]);
  });
});
