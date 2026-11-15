# The Nut Shop

A fictional demo ecommerce site that squirrelscan audits end to end. It is a **test bed**: it looks like a small real shop, and it has a controlled way to be broken and fixed so we can time how long audit findings take to appear and close.

> Every page carries: "The Nut Shop is a demo store run by squirrelscan to test website audits. Nothing here is for sale." There is no real checkout, no payment fields and no form that collects personal data. Everything (brand, products, prices, recipes, business details) is invented.

Live at https://nutshop.squirrelscan.com (once deployed). Repo: `squirrelscan/nut-shop`, MIT licensed (see `LICENSE`).

**What it is:** a demo store used to test and demonstrate squirrelscan audits. All content is fictional: the brand, products, prices, recipes and the business block. Nothing is for sale, nothing collects personal data, and the contact address is a placeholder.

Stack: TanStack Start (React, SSR, file routes), Tailwind v4, Cloudflare Workers. No database: content lives in the repo.

## Run it

```bash
bun install
bun run dev            # http://127.0.0.1:4210 (vite + workerd)
bun run build          # compiles content, then vite build
bun run test           # unit tests (faults + healthy baseline)
bun run typecheck      # tsgo --noEmit
bun run lint           # oxlint
bun run format:check   # oxfmt
bun run check-links    # crawl the running site (add -- --external for outbound links)
```

The hostname is set in one place, `src/config/site.ts`, and defaults to `https://nutshop.squirrelscan.com` (contact `hello@nutshop.squirrelscan.com`). `bun run dev` and `build:local` set `VITE_SITE_URL=http://127.0.0.1:4210` so local canonicals, sitemap, JSON-LD `@id`s and OG URLs point at the local server. A plain `bun run build` bakes in the production host.

## Deploy

`wrangler.jsonc` has no account id: set `CLOUDFLARE_ACCOUNT_ID` in the environment when deploying. It has a custom-domain route for `nutshop.squirrelscan.com`. `bun run deploy` builds and runs `wrangler deploy`. No secrets are needed or stored; the only setting is the `INDEXING` var below. Env files, `.dev.vars`, `.dev.pid`, build output and local audit data are gitignored.

## Indexing

This site must not appear in search engines: it is used in demo videos and as the example report on squirrelscan.com. The `INDEXING` var in `wrangler.jsonc` controls an `X-Robots-Tag` header, set in the Worker on every response (HTML, static files, redirects, errors):

| Mode | Behaviour |
| --- | --- |
| `off` | `X-Robots-Tag: noindex, nofollow` for every client |
| `auditor-only` (default) | the same header for every client except the squirrelscan audit crawler: a User-Agent starting with `SquirrelScan/` (CLI), a User-Agent starting with `squirrel-cloud-audit` (cloud plain fetch), or the request header `X-Squirrel-Audit: nutshop-demo` (cloud renders use a normal Chrome User-Agent, so the audit sends this marker; it is not a secret). Responses add `Vary: User-Agent, X-Squirrel-Audit` |
| `on` | no header |

Why the auditor is exempt: the demo audit should see an indexable shop, so findings such as the fault-system defects are judged on their own merits and are not hidden behind a blanket noindex. This is **not cloaking for ranking**. The only difference between clients is that the audit crawler is not told to noindex; every search engine and unknown bot is always told noindex, so the site is only ever made LESS indexable to third parties than a normal site. Anyone can send that User-Agent or marker; that is fine, they simply see the indexable version of a demo site.

`robots.txt` stays permissive in every mode: a `Disallow` would stop the audit and does not prevent indexing anyway. The `noindex-product` fault still works on top of this (it adds a `<meta name="robots" content="noindex">` to one product page). Tests: `tests/indexing.test.ts`.

## Content

- `src/content/products/*.json` (36 products), `src/content/posts/*.md` (16 posts), `src/content/catalog.ts` (6 categories), `src/content/pages.ts` (static pages, FAQ).
- `bun run content` compiles them into `src/content/generated/*.json` (committed) and validates slugs, internal links, description sizes and word counts.
- `bun run images` regenerates the original SVG illustrations (`public/img`) and PNG social cards (`public/og`).

## Catalogue (/catalogue)

A 2,100-item catalogue, the target for measured rendered (Pro) audits (squirrelscan/repo#2490). Kept apart from the fault system: nothing under `src/catalogue/` calls `fault()`, it has its own footer, and header/lang faults skip `/catalogue*` (test: `tests/catalogue.test.ts` turns every fault on and asserts no change).

- URLs: `/catalogue` (page 1), `/catalogue/page/2` to `/catalogue/page/35` (60 items each), `/catalogue/<slug>` (2,100 items). 2,135 URLs, listed in `/sitemap-catalogue.xml`. Deliberately not advertised: neither `robots.txt` nor `/sitemap.xml` references it and no main-site page links to `/catalogue`, so capped fault-smoke audits seeded at `/` never reach it. Audits of it start from `/catalogue`. Link-check it with `bun run check-links -- --catalogue`.
- Generated from a fixed seed (`CATALOGUE_SEED` in `src/catalogue/generate.ts`: 9 nuts x 16 styles x 15 fictional farms, shuffled, first 2,100) at request time, so nothing is prebuilt and the Worker stays small. Same seed, same output.
- Server HTML: title, meta description, canonical, h1, JSON-LD, description, SKU table and 6 related-item links. Client only (dynamic `import()` of `src/catalogue/client-data.ts` + `client-phrases.json` after hydration): pack price table, stock by depot, 3 to 8 reviews and 4 "pairs well with" links. The raw HTML carries a `data-catalogue-client="pending"` placeholder; rendered DOM has `data-catalogue-client="ready"`.

## Controlled faults

`faults/registry.ts` lists every fault (id, title, what it breaks, pages, expected squirrelscan rule, severity). Every `expectedRule` is **expected, to be confirmed by audit**: it is a best guess, not a verified mapping.

`faults/active.json` is the list of fault ids that are ON. The healthy baseline is `[]`. The app reads it at build time (dev: hot reloaded), so one small commit flips a defect.

```bash
bun run fault list                 # all faults, ON/off, severity, expected rule
bun run fault on broken-internal-link
bun run fault off broken-internal-link
bun run fault status               # active faults: when switched on, and the commit that deployed each
bun run fault reset                # back to the healthy baseline
```

Every toggle appends a line to `faults/LOG.md` (ISO time, action, id, short git sha at toggle time). `scripts/time-to-detect.md` is the template for timing a run.

`leaked-secret-fake` ships a dummy Stripe-shaped key so the leaked-secrets rule fires. It is not a real credential and is assembled from parts at request time (`src/seo/fake-secret.ts`), so no contiguous copy lives in the repo (a test checks with `git grep`). That log is how we measure time-to-detect and time-to-close: commit `active.json` + `LOG.md`, deploy, then compare against the audit timestamps.

Endpoints under `/_fault/` (410 page, 500 page, 3-hop redirect chain, soft 404, slow script, big image) exist in every state; faults only decide whether anything links to them.

Three probe faults serve endpoints outside `/_fault/`, and only while they are on (404 otherwise): `exposed-env-file` (`/.env`, dummy KEY=VALUE secrets), `open-users-api` (`/api/users`, fake @example.com users) and `json-password-field` (`/api/account`, a dummy `password` field). The two API faults also add an inline `fetch()` call site to `/about` so endpoint discovery finds them. squirrelscan reports them only on a probing run (`--probe aggressive`, or a cloud audit with probing allowed). Values are assembled at request time in `src/seo/fake-probe-data.ts`.

`tests/faults.test.ts` renders the affected route/head/sitemap/headers with each fault off and on and asserts the claimed change. `Record<FaultId, Probe>` makes a fault without a probe a type error. `tests/baseline.test.ts` checks the healthy site: unique titles/descriptions, canonicals, JSON-LD, sitemap equals the indexable pages, headers, alt text and dimensions, no broken internal link targets.

## Healthy baseline notes

- Headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, nosniff, COOP), ETag/Last-Modified with 304 handling, and the http to https 301 fallback are set in the Worker (`src/server.ts`, `src/server/headers.ts`).
- The CSP allows `'unsafe-inline'` scripts because TanStack Start inlines its hydration scripts. squirrelscan reports this as a warning in the baseline.
- Social cards are PNG; the product, category and post illustrations are SVG.
- Noindex pages (`/search`, `/cart`, `/order-demo`) are not in the sitemap, carry no JSON-LD and are not blocked in robots.txt.
