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
