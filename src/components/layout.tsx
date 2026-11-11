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
    <a href="/cart" className="font-semibold">
      Cart <span aria-label={`${n} items in cart`}>({n})</span>
    </a>
  );
}

function Newsletter() {
  const [msg, setMsg] = useState("");
  const noLabel = fault("form-input-no-label");
  return (
    <div role="group" aria-label="Newsletter demo" className="mt-2 flex flex-col gap-2">
      {noLabel ? null : (
        <label htmlFor="newsletter-email" className="text-sm">
          Email address (demo, nothing is sent)
        </label>
      )}
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded border border-line bg-white px-3 py-2"
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMsg("Demo only: nothing was sent and nothing is stored.")}
        >
          Join
        </button>
      </div>
      <p role="status" className="min-h-5 text-sm text-muted">
        {msg || "The newsletter box is a demo and does not submit anything."}
      </p>
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b border-line bg-card">
      <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <a
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-ink no-underline"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          <img src="/logo.svg" alt="" width={32} height={32} />
          {SITE.name}
        </a>
        <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-1">
          <a href="/shop">Products</a>
          <a href="/blog">Journal</a>
          <a href="/about">About</a>
          <a href="/faq">FAQ</a>
        </nav>
        <form
          role="search"
          action="/search"
          method="get"
          className="ml-auto flex items-center gap-2"
        >
          <label htmlFor="site-search" className="sr-only">
            Search the shop
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            placeholder="Search nuts and posts"
            className="w-44 rounded border border-line bg-white px-3 py-1.5"
          />
          <button type="submit" className="btn btn-ghost py-1.5">
            Search
          </button>
        </form>
        <CartLink />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="wrap grid gap-8 py-10 md:grid-cols-4">
        <div>
          <h2 className="text-lg">Shop</h2>
          <ul className="mt-2 space-y-1">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <a href={`/categories/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg">Learn and help</h2>
          <ul className="mt-2 space-y-1">
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
          </ul>
        </div>
        <div>
          <h2 className="text-lg">The small print</h2>
          <ul className="mt-2 space-y-1">
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
          <p className="mt-3 text-sm text-muted">
            {SITE.business.legalName}. {SITE.business.registration} {SITE.business.address}
          </p>
        </div>
        <div>
          <h2 className="text-lg">Newsletter (demo)</h2>
          <Newsletter />
        </div>
      </div>
      <div className="border-t border-line">
        <p className="wrap py-4 text-sm text-muted">{SITE.demoNotice}</p>
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
      <main id="main" className="wrap py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
      <ol className="flex flex-wrap gap-x-2">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex gap-2">
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
