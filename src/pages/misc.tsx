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
      <h1 className="text-4xl">Your cart</h1>
      <p className="mt-2 text-muted">
        This cart lives only in your browser. It is a demo: no order can be placed.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6">
          Your cart is empty. <a href="/shop">Browse all products</a>.
        </p>
      ) : (
        <div className="mt-6">
          <ul className="divide-y divide-line">
            {rows.map(({ l, p, v }) => (
              <li key={`${l.slug}-${l.weightG}`} className="flex flex-wrap items-center gap-4 py-3">
                <a href={`/products/${p.slug}`} className="flex-1">
                  {p.name}, {v.label}
                </a>
                <label className="text-sm" htmlFor={`q-${l.slug}-${l.weightG}`}>
                  Quantity
                </label>
                <input
                  id={`q-${l.slug}-${l.weightG}`}
                  type="number"
                  min={0}
                  value={l.qty}
                  onChange={(e) => setQty(l.slug, l.weightG, Number(e.target.value))}
                  className="w-20 rounded border border-line bg-white px-2 py-1"
                />
                <span className="w-24 text-right">{money(v.priceCents * l.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xl font-semibold">Total {money(total)}</p>
          <p className="mt-4 flex gap-3">
            <a href="/order-demo" className="btn" onClick={() => clearCart()}>
              Checkout (demo)
            </a>
            <button type="button" className="btn btn-ghost" onClick={() => clearCart()}>
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
      <h1 className="text-4xl">This is a demo, orders are not taken</h1>
      <p className="mt-4 max-w-prose text-lg">
        Thanks for trying the cart. The Nut Shop is a demo store run by squirrelscan to test website
        audits, so there is nothing to pay for and nothing will be sent.
      </p>
      <p className="mt-6 flex gap-3">
        <a href="/shop" className="btn">
          Back to the shop
        </a>
        <a href="/blog" className="btn btn-ghost">
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
      <h1 className="text-4xl">Search</h1>
      {q ? (
        <p className="mt-2 text-muted">
          {products.length + posts.length} results for “{q}”.
        </p>
      ) : (
        <p className="mt-2 text-muted">
          Type a word in the search box above, for example “almond”.
        </p>
      )}
      {products.length ? (
        <section className="mt-8" aria-labelledby="sp">
          <h2 id="sp" className="text-2xl">
            Products
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ) : null}
      {posts.length ? (
        <section className="mt-8" aria-labelledby="sj">
          <h2 id="sj" className="text-2xl">
            Journal
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
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
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-4 max-w-prose text-lg">
        We could not find that page. Try the <a href="/shop">shop</a>, the{" "}
        <a href="/blog">journal</a> or the <a href="/">home page</a>.
      </p>
      <p className="mt-6 text-muted">{PRODUCTS.length} products are waiting for you somewhere.</p>
    </Layout>
  );
}
