import { PRODUCTS, getProduct, searchProducts } from "#/content";
import { money } from "#/lib/format";
import { clearCart, setQty, useCart } from "#/lib/cart";
import { Layout } from "#/components/layout";
import { PostCard } from "#/pages/content";
import { ProductCard } from "#/pages/shop";

export function CartPage() {
  const lines = useCart();
  const rows = lines.flatMap((l) => {
    const p = getProduct(l.slug);
    const v = p?.variants.find((x) => x.weightG === l.weightG);
    return p && v ? [{ l, p, v }] : [];
  });
  const total = rows.reduce((s, r) => s + r.v.priceCents * r.l.qty, 0);
  return (
    <Layout>
      <div className="page-head">
        <h1>Your cart</h1>
        <p className="lead">
          This cart lives only in your browser. It is a demo: no order can be placed.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          <img src="/logo.svg" alt="" width={96} height={96} />
          <h2>Your cart is empty</h2>
          <p>Nothing in here yet. The almonds are a good place to start.</p>
          <a href="/shop" className="btn">
            Browse all products
          </a>
        </div>
      ) : (
        <div style={{ maxWidth: "44rem" }}>
          <ul className="list-none">
            {rows.map(({ l, p, v }) => (
              <li key={`${l.slug}-${l.weightG}`} className="cart-line">
                <a href={`/products/${p.slug}`} className="line-name">
                  {p.name}, {v.label}
                </a>
                <div className="field">
                  <label className="label" htmlFor={`q-${l.slug}-${l.weightG}`}>
                    Quantity
                  </label>
                  <input
                    id={`q-${l.slug}-${l.weightG}`}
                    type="number"
                    min={0}
                    value={l.qty}
                    onChange={(e) => setQty(l.slug, l.weightG, Number(e.target.value))}
                    className="input"
                  />
                </div>
                <span />
                <span className="price">{money(v.priceCents * l.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="cart-total">
            <span>Total</span>
            <span className="price price-lg">{money(total)}</span>
          </p>
          <p className="actions">
            <a href="/order-demo" className="btn" onClick={() => clearCart()}>
              Checkout (demo)
            </a>
            <button type="button" className="btn-quiet" onClick={() => clearCart()}>
              Empty cart
            </button>
          </p>
        </div>
      )}
    </Layout>
  );
}

export function OrderDemoPage() {
  return (
    <Layout>
      <div className="page-head">
        <h1>This is a demo, orders are not taken</h1>
        <p className="lead">
          Thanks for trying the cart. The Nut Shop is a demo store run by squirrelscan to test
          website audits, so there is nothing to pay for and nothing will be sent.
        </p>
      </div>
      <p className="actions">
        <a href="/shop" className="btn">
          Back to the shop
        </a>
        <a href="/blog" className="btn-secondary">
          Read the journal
        </a>
      </p>
    </Layout>
  );
}

export function SearchPage({ q }: { q: string }) {
  const { products, posts } = searchProducts(q);
  return (
    <Layout>
      <div className="page-head">
        <h1>Search</h1>
        <form
          role="search"
          action="/search"
          method="get"
          className="field-row"
          style={{ maxWidth: "28rem", marginTop: "var(--s-4)" }}
        >
          <label htmlFor="page-search" className="sr-only">
            Search the shop
          </label>
          <input
            id="page-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Try almond"
            className="input"
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>
        {q ? (
          <p className="lead">
            {products.length + posts.length} results for “{q}”.
          </p>
        ) : (
          <p className="lead">Type a word in the search box, for example “almond”.</p>
        )}
      </div>
      {q && products.length + posts.length === 0 ? (
        <div className="empty">
          <h2>No matches</h2>
          <p>Try a shorter word, or look through the whole shop.</p>
          <a href="/shop" className="btn-secondary">
            Browse all products
          </a>
        </div>
      ) : null}
      {products.length ? (
        <section className="section-tight" aria-labelledby="sp">
          <div className="section-head">
            <h2 id="sp">Products</h2>
          </div>
          <div className="grid grid-4">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ) : null}
      {posts.length ? (
        <section className="section" aria-labelledby="sj">
          <div className="section-head">
            <h2 id="sj">Journal</h2>
          </div>
          <div className="grid grid-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </Layout>
  );
}

export function NotFoundPage() {
  return (
    <Layout>
      <div className="notfound">
        <p className="code" aria-hidden="true">
          404
        </p>
        <h1>Page not found</h1>
        <p className="lead">
          We could not find that page. It may have been eaten. Try the <a href="/shop">shop</a>, the{" "}
          <a href="/blog">journal</a> or the <a href="/">home page</a>.
        </p>
        <p className="actions">
          <a href="/shop" className="btn">
            Browse all products
          </a>
          <a href="/" className="btn-secondary">
            Back to the home page
          </a>
        </p>
        <p className="hint">{PRODUCTS.length} products are waiting for you somewhere.</p>
      </div>
    </Layout>
  );
}
