# The Nut Shop

A fictional demo ecommerce site that squirrelscan audits end to end. It is a **test bed**: it looks like a small real shop, and it has a controlled way to be broken and fixed so we can time how long audit findings take to appear and close.

> Every page carries: "The Nut Shop is a demo store run by squirrelscan to test website audits. Nothing here is for sale." There is no real checkout, no payment fields and no form that collects personal data. Everything (brand, products, prices, recipes, business details) is invented.

Stack: TanStack Start (React, SSR, file routes), Tailwind v4, Cloudflare Workers (wrangler config present, **not deployed**). No database: content lives in the repo.

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

The hostname is set in one place, `src/config/site.ts`. Build with `VITE_SITE_URL=https://example.test bun run build` to change canonicals, sitemap, JSON-LD `@id`s, OG URLs and the contact email (`hello@<host>`).

## Content

- `src/content/products/*.json` (36 products), `src/content/posts/*.md` (16 posts), `src/content/catalog.ts` (6 categories), `src/content/pages.ts` (static pages, FAQ).
- `bun run content` compiles them into `src/content/generated/*.json` (committed) and validates slugs, internal links, description sizes and word counts.
- `bun run images` regenerates the original SVG illustrations (`public/img`) and PNG social cards (`public/og`).

## Controlled faults

`faults/registry.ts` lists every fault (id, title, what it breaks, pages, expected squirrelscan rule, severity). Every `expectedRule` is **expected, to be confirmed by audit**: it is a best guess, not a verified mapping.

`faults/active.json` is the list of fault ids that are ON. The healthy baseline is `[]`. The app reads it at build time (dev: hot reloaded), so one small commit flips a defect.

```bash
bun run fault list                 # all faults, ON/off, severity, expected rule
bun run fault on broken-internal-link
bun run fault off broken-internal-link
bun run fault reset                # back to the healthy baseline
```

Every toggle appends a line to `faults/LOG.md` (ISO time, action, id). That log is how we measure time-to-detect and time-to-close: commit `active.json` + `LOG.md`, deploy, then compare against the audit timestamps.

Endpoints under `/_fault/` (410 page, 3-hop redirect chain, soft 404, slow script, big image) exist in every state; faults only decide whether anything links to them.

`tests/faults.test.ts` renders the affected route/head/sitemap/headers with each fault off and on and asserts the claimed change. `Record<FaultId, Probe>` makes a fault without a probe a type error. `tests/baseline.test.ts` checks the healthy site: unique titles/descriptions, canonicals, JSON-LD, sitemap equals the indexable pages, headers, alt text and dimensions, no broken internal link targets.

## Healthy baseline notes

- Headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, nosniff, COOP), ETag/Last-Modified with 304 handling, and the http to https 301 fallback are set in the Worker (`src/server.ts`, `src/server/headers.ts`).
- The CSP allows `'unsafe-inline'` scripts because TanStack Start inlines its hydration scripts. squirrelscan reports this as a warning in the baseline.
- Social cards are PNG; the product, category and post illustrations are SVG.
- Noindex pages (`/search`, `/cart`, `/order-demo`) are not in the sitemap, carry no JSON-LD and are not blocked in robots.txt.
