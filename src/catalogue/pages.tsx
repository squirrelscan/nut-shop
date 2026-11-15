import { useEffect, useState } from "react";
import { SITE } from "#/config/site";
import { money } from "#/lib/format";
import { Breadcrumbs, Header } from "#/components/layout";
import {
  CATALOGUE_SIZE,
  PAGE_COUNT,
  cataloguePage,
  itemPath,
  listingPath,
  pageOf,
  relatedItems,
  type CatalogueItem,
} from "./generate";
import { itemCrumbs, listingCrumbs } from "./head";
import type { ClientDetails } from "./client-data";

/**
 * Catalogue layout. Uses the shared Header (no faults) but its own footer: the site Footer
 * carries fault toggles (newsletter label, footer links), and /catalogue/ must not change with them.
 */
function CatalogueLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" className="wrap page">
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <p className="footer-small">
            <a href="/">Home</a> · <a href={listingPath(1)}>Catalogue</a> · <a href="/shop">Shop</a>{" "}
            · <a href="/about">About</a>
          </p>
        </div>
        <div className="footer-base">
          <p className="wrap">{SITE.demoNotice}</p>
        </div>
      </footer>
    </>
  );
}

function Pager({ current }: { current: number }) {
  return (
    <nav aria-label="Catalogue pages" className="section-tight">
      <ul className="actions list-none">
        {Array.from({ length: PAGE_COUNT }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === current ? (
              <span aria-current="page" className="btn">
                {n}
              </span>
            ) : (
              <a href={listingPath(n)} className="btn-secondary">
                {n}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ItemCard({ item }: { item: CatalogueItem }) {
  return (
    <article className="card">
      <div className="card-body">
        <h2 className="card-title">
          <a href={itemPath(item)}>{item.name}</a>
        </h2>
        <p className="card-text card-clamp">{item.tagline}</p>
        <p className="card-foot">
          <span className="price">
            <small>From </small>
            {money(item.fromCents)}
          </span>
        </p>
      </div>
    </article>
  );
}

export function CatalogueListingPage({ page }: { page: number }) {
  const items = cataloguePage(page);
  return (
    <CatalogueLayout>
      <Breadcrumbs crumbs={listingCrumbs(page)} />
      <div className="page-head">
        <h1>{page === 1 ? "The catalogue" : `The catalogue, page ${page}`}</h1>
        <p className="lead">
          {CATALOGUE_SIZE.toLocaleString("en")} imaginary nut products from fictional growers,
          generated from a fixed seed. Page {page} of {PAGE_COUNT}. Nothing here is for sale.
        </p>
      </div>
      <Pager current={page} />
      <div className="grid grid-4">
        {items.map((item) => (
          <ItemCard key={item.slug} item={item} />
        ))}
      </div>
      <Pager current={page} />
    </CatalogueLayout>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-label={`${rating} out of 5`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

/**
 * Client-rendered details. The server renders only the placeholder; the data module is
 * imported after hydration, so the raw HTML never contains reviews, pack prices or stock.
 */
function ClientDetailsSection({ item }: { item: CatalogueItem }) {
  const [d, setD] = useState<ClientDetails | null>(null);
  useEffect(() => {
    let live = true;
    void import("./client-data").then((m) => {
      if (live) setD(m.clientDetails(item));
    });
    return () => {
      live = false;
    };
  }, [item]);
  if (!d)
    return (
      <section className="section" aria-busy="true" data-catalogue-client="pending">
        <p className="hint">Loading prices, stock and reviews.</p>
      </section>
    );
  return (
    <div data-catalogue-client="ready">
      <section className="section" aria-labelledby="cat-prices">
        <h2 id="cat-prices">Pack sizes and prices</h2>
        <p>
          <strong>{d.badge}</strong>. Rated <Stars rating={d.rating} /> ({d.rating} from{" "}
          {d.reviews.length} reviews).
        </p>
        <table>
          <thead>
            <tr>
              <th scope="col">Pack</th>
              <th scope="col">Price</th>
              <th scope="col">Per 100 g</th>
            </tr>
          </thead>
          <tbody>
            {d.prices.map((p) => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>{money(p.priceCents)}</td>
                <td>{money(p.per100gCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="section" aria-labelledby="cat-stock">
        <h2 id="cat-stock">Stock by depot</h2>
        <ul>
          {d.stock.map((s) => (
            <li key={s.depot}>
              {s.depot}: {s.units === 0 ? "out of stock" : `${s.units} bags`}
            </li>
          ))}
        </ul>
      </section>
      <section className="section" aria-labelledby="cat-reviews">
        <h2 id="cat-reviews">Customer reviews</h2>
        {d.reviews.map((rv, i) => (
          <article key={i} className="section-tight">
            <h3>
              {rv.author} <Stars rating={rv.rating} />
            </h3>
            <p className="hint">
              <time dateTime={rv.date}>{rv.date}</time> (fictional review)
            </p>
            <p>{rv.body}</p>
          </article>
        ))}
      </section>
      <section className="section" aria-labelledby="cat-pairs">
        <h2 id="cat-pairs">Pairs well with</h2>
        <ul>
          {d.pairs.map((p) => (
            <li key={p.path}>
              <a href={p.path}>{p.name}</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function CatalogueItemPage({ item }: { item: CatalogueItem }) {
  const related = relatedItems(item);
  const page = pageOf(item);
  return (
    <CatalogueLayout>
      <Breadcrumbs crumbs={itemCrumbs(item)} />
      <div className="split">
        <div>
          <img
            src={`/img/products/${item.image}.svg`}
            alt={`An illustration of ${item.nutPlural}`}
            width={800}
            height={600}
            loading="eager"
            decoding="async"
            className="h-auto w-full"
          />
        </div>
        <div>
          <h1>{item.name}</h1>
          <p className="lead">{item.tagline}</p>
          <p className="price price-lg">
            <small>From </small>
            {money(item.fromCents)}
          </p>
          <dl>
            <dt>SKU</dt>
            <dd>{item.sku}</dd>
            <dt>Shelf</dt>
            <dd>{item.category}</dd>
            <dt>Grade</dt>
            <dd>{item.grade}</dd>
            <dt>Harvest</dt>
            <dd>{item.harvest}</dd>
          </dl>
        </div>
      </div>
      <section className="section" aria-labelledby="cat-about">
        <h2 id="cat-about">About these {item.nutPlural}</h2>
        {item.description.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>
      <ClientDetailsSection item={item} />
      <section className="section" aria-labelledby="cat-related">
        <h2 id="cat-related">Related items</h2>
        <ul>
          {related.map((r) => (
            <li key={r.slug}>
              <a href={itemPath(r)}>{r.name}</a>
            </li>
          ))}
        </ul>
        <p>
          <a href={listingPath(page)}>Back to catalogue page {page}</a>
        </p>
      </section>
    </CatalogueLayout>
  );
}
