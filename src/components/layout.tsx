import { useState } from "react";
import { SITE } from "#/config/site";
import { CATEGORIES } from "#/content";
import { fault } from "../../faults/runtime";
import { useCart } from "#/lib/cart";
import type { Crumb } from "#/seo/jsonld";

function CartLink() {
  const lines = useCart();
  const n = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <a href="/cart" aria-label={`Cart, ${n} items`}>
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.800H8.200a2 2 0 0 1-2-1.800L5 8Z" />
        <path d="M9 8V6.500a3 3 0 0 1 6 0V8" />
      </svg>
      <span className="cart-count" aria-hidden="true">
        {n}
      </span>
    </a>
  );
}

function Newsletter() {
  const [msg, setMsg] = useState("");
  const noLabel = fault("form-input-no-label");
  return (
    <div role="group" aria-label="Newsletter demo" className="field">
      {noLabel ? null : (
        <label htmlFor="newsletter-email" className="label">
          Email address (demo, nothing is sent)
        </label>
      )}
      <div className="field-row">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="input"
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setMsg("Demo only: nothing was sent and nothing is stored.")}
        >
          Join
        </button>
      </div>
      <p role="status" className="hint">
        {msg || "The newsletter box is a demo and does not submit anything."}
      </p>
    </div>
  );
}

export function Brand() {
  return (
    <a href="/" className="brand">
      <img src="/logo.svg" alt="" width={36} height={36} />
      {SITE.name}
    </a>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="notice">
        <p className="wrap">Demo store: nothing here is for sale.</p>
      </div>
      <div className="wrap header-bar">
        <Brand />
        <nav aria-label="Main" className="nav">
          <a href="/shop">Products</a>
          <a href="/blog">Journal</a>
          <a href="/about">About</a>
          <a href="/faq">FAQ</a>
        </nav>
        <form role="search" action="/search" method="get" className="search-form">
          <label htmlFor="site-search" className="sr-only">
            Search the shop
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            placeholder="Search nuts and posts"
            className="input"
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>
        <div className="header-tools">
          <a href="/search" className="search-link" aria-label="Search">
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.500" />
              <path d="m16 16 4 4" />
            </svg>
          </a>
          <CartLink />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Brand />
          <p className="footer-small">{SITE.tagline}.</p>
          <p className="footer-small">
            {SITE.business.legalName}. {SITE.business.registration} {SITE.business.address}
          </p>
        </div>
        <div>
          <h2>Shop</h2>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <a href={`/categories/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Learn and help</h2>
          <ul>
            <li>
              <a href="/blog">Journal</a>
            </li>
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/shipping-and-returns">Shipping and returns</a>
            </li>
            {fault("orphan-gift-guide") ? null : (
              <li>
                <a href="/gift-guide">Gift guide</a>
              </li>
            )}
            <li>
              <a href="/contact">Contact</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/privacy">Privacy policy</a>
            </li>
            <li>
              <a href="/terms">Terms of use</a>
            </li>
          </ul>
        </div>
        <div>
          <h2>Newsletter (demo)</h2>
          <Newsletter />
        </div>
      </div>
      <div className="footer-base">
        <p className="wrap">{SITE.demoNotice}</p>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" className="wrap page">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {crumbs.map((c, i) => (
          <li key={c.path}>
            {i < crumbs.length - 1 ? (
              <a href={c.path}>{c.name}</a>
            ) : (
              <span aria-current="page">{c.name}</span>
            )}
            {i < crumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
