import { useState } from 'react'
import { SITE } from '#/config/site'
import { CATEGORIES, POSTS, PRODUCTS, fromPrice, getCategory, postsFor, productsIn, relatedProducts } from '#/content'
import { ALLERGY_LINKS, NUT_WIKI } from '#/content/catalog'
import type { Category, Product } from '#/content/types'
import { money } from '#/lib/format'
import { addToCart } from '#/lib/cart'
import { Breadcrumbs, Layout } from '#/components/layout'
import { Img, ProductImage } from '#/components/media'
import { PostCard } from '#/pages/content'
import { categoryCrumbs, productCrumbs } from '#/seo/head'
import { fault } from '../../faults/runtime'

export function ProductCard({ p }: { p: Product }) {
  return (
    <article className="card flex flex-col">
      <a href={`/products/${p.slug}`} className="block">
        <ProductImage product={p} width={400} height={300} className="h-auto w-full" />
      </a>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg">
          <a href={`/products/${p.slug}`}>{p.name}</a>
        </h3>
        <p className="flex-1 text-sm text-muted">{p.tagline}</p>
        <p className="font-semibold">From {money(fromPrice(p))}</p>
      </div>
    </article>
  )
}

export function CategoryCard({ c }: { c: Category }) {
  return (
    <a href={`/categories/${c.slug}`} className="card block no-underline">
      <Img src={`/img/categories/${c.slug}.svg`} alt={`Illustration for ${c.name.toLowerCase()}`} width={400} height={250} className="h-auto w-full" />
      <span className="block p-4">
        <span className="block text-lg font-semibold text-ink" style={{ fontFamily: 'var(--font-serif)' }}>{c.name}</span>
        <span className="mt-1 block text-sm text-muted">{c.intro}</span>
      </span>
    </a>
  )
}

export function HomePage() {
  const heroSrc = fault('image-oversized') ? '/_fault/big-image.svg' : '/img/hero.svg'
  const featured = ['raw-almonds', 'maple-glazed-pecans', 'almond-butter', 'classic-trail-mix', 'tasting-flight-box', 'ground-almonds', 'chilli-lime-cashews', 'nut-butter-trio']
    .map((s) => PRODUCTS.find((p) => p.slug === s)!)
  return (
    <Layout>
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl md:text-5xl">Nuts, nut butters and trail mixes, kept simple</h1>
          <p className="mt-4 text-lg" style={fault('low-contrast-text') ? { color: '#b9b9b9', background: '#fbf6ee' } : undefined}>
            A small shop with a short shelf: raw and roasted nuts, spreads ground in small jars, mixes with a bit of everything, and boxes ready to give.
          </p>
          <p className="mt-2 text-sm text-muted">{SITE.demoNotice}</p>
          <p className="mt-6 flex flex-wrap gap-3">
            <a href="/shop" className="btn">Browse the shop</a>
            <a href="/blog" className="btn btn-ghost">Read the journal</a>
          </p>
          {fault('redirect-chain-3-hops') ? (
            <p className="mt-4 text-sm">
              <a href="/_fault/r1">Seasonal picks</a>
            </p>
          ) : null}
        </div>
        <Img src={heroSrc} alt="A heap of illustrated almonds, walnuts, pecans and cashews" width={1200} height={600} priority className="h-auto w-full rounded-xl" />
      </section>

      <section className="mt-14" aria-labelledby="cats">
        <h2 id="cats" className="text-3xl">Shop by category</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => <CategoryCard key={c.slug} c={c} />)}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="featured">
        <h2 id="featured" className="text-3xl">Customer favourites, on paper</h2>
        <p className="mt-2 text-muted">These are the pages people open most in our imaginary shop.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="journal">
        <h2 id="journal" className="text-3xl">From the journal</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {POSTS.slice(0, 3).map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
        <p className="mt-4"><a href="/blog">All journal posts</a></p>
      </section>
    </Layout>
  )
}

export function ShopPage() {
  return (
    <Layout>
      <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }]} />
      <h1 className="text-4xl">All products</h1>
      <p className="mt-2 max-w-prose text-muted">{PRODUCTS.length} products in {CATEGORIES.length} categories. This is a demo catalogue: nothing is for sale.</p>
      {CATEGORIES.map((c) => (
        <section key={c.slug} className="mt-10" aria-labelledby={`c-${c.slug}`}>
          <h2 id={`c-${c.slug}`} className="text-2xl"><a href={`/categories/${c.slug}`}>{c.name}</a></h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {productsIn(c.slug).map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        </section>
      ))}
    </Layout>
  )
}

export function CategoryPage({ category }: { category: Category }) {
  const items = productsIn(category.slug)
  const others = CATEGORIES.filter((c) => c.slug !== category.slug)
  return (
    <Layout>
      <Breadcrumbs crumbs={categoryCrumbs(category)} />
      <h1 className="text-4xl">{category.name}</h1>
      <p className="mt-2 max-w-prose text-lg text-muted">{category.intro}</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
      <section className="mt-12" aria-labelledby="more-cats">
        <h2 id="more-cats" className="text-2xl">More categories</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {others.map((c) => <li key={c.slug}><a href={`/categories/${c.slug}`}>{c.name}</a></li>)}
        </ul>
      </section>
    </Layout>
  )
}

function AddToCart({ p }: { p: Product }) {
  const [idx, setIdx] = useState(0)
  const [added, setAdded] = useState(false)
  const v = p.variants[idx]!
  return (
    <div className="mt-4 space-y-3">
      <div>
        <label htmlFor="variant" className="block text-sm font-semibold">Size</label>
        <select id="variant" value={idx} onChange={(e) => setIdx(Number(e.target.value))} className="mt-1 rounded border border-line bg-white px-3 py-2">
          {p.variants.map((x, i) => <option key={x.weightG} value={i}>{x.label} ({money(x.priceCents)})</option>)}
        </select>
      </div>
      <p className="text-2xl font-semibold" aria-live="polite">{money(v.priceCents)}</p>
      <button type="button" className="btn" onClick={() => { addToCart(p.slug, v.weightG); setAdded(true) }}>Add to cart (demo)</button>
      <p role="status" className="min-h-5 text-sm text-muted">{added ? 'Added to your demo cart. ' : ''}<a href="/cart">View cart</a></p>
    </div>
  )
}

export function ProductPage({ product: p }: { product: Product }) {
  const related = relatedProducts(p)
  const posts = postsFor(p)
  const wiki = NUT_WIKI[p.nut]!
  const contains = (p.contains ?? []).map((s) => PRODUCTS.find((x) => x.slug === s)).filter((x): x is Product => !!x)
  const n = p.nutrition
  const rows: [string, string][] = [
    ['Energy', `${n.energyKcal} kcal`], ['Fat', `${n.fatG} g`], ['of which saturates', `${n.saturatesG} g`], ['Carbohydrate', `${n.carbsG} g`],
    ['of which sugars', `${n.sugarsG} g`], ['Fibre', `${n.fibreG} g`], ['Protein', `${n.proteinG} g`], ['Salt', `${n.saltG} g`],
  ]
  return (
    <Layout>
      <Breadcrumbs crumbs={productCrumbs(p)} />
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage product={p} width={800} height={600} priority className="h-auto w-full rounded-xl" />
        <div>
          <h1 className="text-4xl">{p.name}</h1>
          <p className="mt-2 text-lg text-muted">{p.tagline}</p>
          <AddToCart p={p} />
          <p className="mt-4 text-sm">
            Allergens: <strong>{p.allergens.length ? p.allergens.join(', ') : 'none declared'}</strong>. {p.mayContain}
          </p>
          <p className="mt-1 text-sm text-muted">Demo store: nothing is for sale and no order can be placed.</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <section aria-labelledby="about-product" className="prose-nuts">
            <h2 id="about-product">About this product</h2>
            {p.description.map((para, i) => <p key={i}>{para}</p>)}
            <p>
              Learn more about the <a href={wiki.href} rel="noopener">{wiki.label.toLowerCase()}</a> on Wikipedia, or browse the whole <a href={`/categories/${p.category}`}>{getCategory(p.category)!.name.toLowerCase()}</a> range.
            </p>
          </section>
          {contains.length ? (
            <section className="mt-8" aria-labelledby="inside">
              <h2 id="inside" className="text-2xl">What is inside</h2>
              <ul className="mt-3 list-disc pl-6">
                {contains.map((c) => <li key={c.slug}><a href={`/products/${c.slug}`}>{c.name}</a></li>)}
              </ul>
            </section>
          ) : null}
          <section className="mt-8" aria-labelledby="ingredients">
            <h2 id="ingredients" className="text-2xl">Ingredients and allergens</h2>
            <p className="mt-2"><strong>Ingredients:</strong> {p.ingredients}</p>
            <p className="mt-2"><strong>Allergens:</strong> {p.allergens.length ? p.allergens.join(', ') : 'none declared'}. {p.mayContain}</p>
            <p className="mt-2 text-sm text-muted">
              Not medical advice. Read the label of any food you buy and see the guidance from the <a href={ALLERGY_LINKS[0]!.href} rel="noopener">US FDA</a> or the <a href={ALLERGY_LINKS[1]!.href} rel="noopener">UK Food Standards Agency</a>.
            </p>
          </section>
          <section className="mt-8" aria-labelledby="nutrition">
            <h2 id="nutrition" className="text-2xl">Nutrition</h2>
            <table className="mt-3 w-full max-w-md border-collapse text-left">
              <caption className="mb-2 text-left text-sm text-muted">Typical values per 100 g (illustrative, this is a demo product)</caption>
              <thead><tr><th scope="col" className="border-b border-line py-1">Nutrient</th><th scope="col" className="border-b border-line py-1">Per 100 g</th></tr></thead>
              <tbody>
                {rows.map(([k, v]) => <tr key={k}><th scope="row" className="border-b border-line py-1 font-normal">{k}</th><td className="border-b border-line py-1">{v}</td></tr>)}
              </tbody>
            </table>
          </section>
          <section className="mt-8" aria-labelledby="storage">
            <h2 id="storage" className="text-2xl">Storage</h2>
            <p className="mt-2 max-w-prose">{p.storage}</p>
          </section>
          {fault('mixed-content-image') && p.slug === 'smooth-peanut-butter' ? (
            <p className="mt-6"><img src={`http://${SITE.host}/logo.svg`} alt="The Nut Shop badge" width={64} height={64} /></p>
          ) : null}
        </div>
        <aside aria-label="Related reading">
          {posts.length ? (
            <section aria-labelledby="from-journal">
              <h2 id="from-journal" className="text-xl">From the journal</h2>
              <ul className="mt-3 space-y-2">
                {posts.map((post) => <li key={post.slug}><a href={`/blog/${post.slug}`}>{post.title}</a></li>)}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      <section className="mt-12" aria-labelledby="related">
        <h2 id="related" className="text-2xl">You might also like</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => <ProductCard key={r.slug} p={r} />)}
        </div>
        {fault('broken-internal-link') && p.slug === 'raw-almonds' ? (
          <p className="mt-4"><a href="/products/almond-brittle-deluxe">Almond brittle deluxe</a></p>
        ) : null}
      </section>
    </Layout>
  )
}
