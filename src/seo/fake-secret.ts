/**
 * FAKE test credential for the `leaked-secret-fake` fault. It is not, and
 * cannot be, a real credential: it was typed at random for squirrelscan's demo
 * store and has never been issued by any provider. It has the shape of a
 * Stripe live secret key (so squirrelscan's security/leaked-secrets rule flags
 * it), and is assembled from parts at request time so no contiguous copy sits
 * in this repository (GitHub push protection and other scanners would flag it).
 */
const PARTS = ["sk_", "live_", "Qm7vXk2p", "Rt9Ld4Nz", "Bw8YcHf3"] as const;

export const fakeSecretKey = (): string => PARTS.join("");

/** Inline config object, the way real leaks usually look. */
export const leakedConfigScript = (): string =>
  `window.__SHOP_CONFIG__ = { region: "au", paymentsKey: "${fakeSecretKey()}" };`;

/** Same value in a small JS asset (served by /_fault/shop-config.js only while the fault is on). */
export const leakedConfigAsset = (): string => `${leakedConfigScript()}\n`;

export const LEAK_PAGE_SLUG = "crunchy-peanut-butter";

/**
 * FAKE test token for the `inline-script-with-token` fault: GitHub personal access token shape
 * (ghp_ plus 30 random-looking characters plus the 6-character base62 CRC32 checksum GitHub
 * appends, which squirrelscan's rule validates), a different vendor from the Stripe-shaped key
 * above. The 30 characters were typed at random for this demo store and the token was never
 * issued by any provider: it is fake and must never be tested against any service. Assembled at
 * request time so no contiguous copy sits in the repository.
 */
const TOKEN_PARTS = ["ghp_", "Zk3Qx9Tv", "Lb7MrN2p", "Wc8YdH4f", "Gs1JuA", "0iOxU4"] as const;

export const fakeTokenValue = (): string => TOKEN_PARTS.join("");

export const inlineTokenScript = (): string =>
  `window.__DEPLOY_INFO__ = { env: "production", githubToken: "${fakeTokenValue()}" };`;

export const TOKEN_PAGE_PATH = "/contact";
