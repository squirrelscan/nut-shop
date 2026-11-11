import { useState } from "react";
import { SITE } from "#/config/site";
import {
  CATEGORIES,
  POSTS,
  PRODUCTS,
  fromPrice,
  getCategory,
  postsFor,
  productsIn,
  relatedProducts,
} from "#/content";
import { ALLERGY_LINKS, NUT_WIKI } from "#/content/catalog";
import type { Category, Product } from "#/content/types";
import { money } from "#/lib/format";
import { addToCart } from "#/lib/cart";
import { Breadcrumbs, Layout } from "#/components/layout";
import { Img, ProductImage } from "#/components/media";
import { PostCard } from "#/pages/content";
import { categoryCrumbs, productCrumbs } from "#/seo/head";
import { fault } from "../../faults/runtime";

export function ProductCard({
  p,
  level = "h3",
  eager = false,
}: {
  p: Product;
  level?: "h2" | "h3";
  eager?: boolean;
}) {
  const H = level;
  return (
    <article className="card">
      <div className="card-media" aria-hidden="true">
        <ProductImage
          product={p}
          width={400}
          height={300}
          eager={eager}
          decorative
          className="h-auto w-full"
        />
      </div>
      <div className="card-body">
        <H className="card-title">
          <a href={`/products/${p.slug}`}>{p.name}</a>
        </H>
        <p className="card-text card-clamp">{p.tagline}</p>
        <p className="card-foot">
          <span className="price">
            <small>From </small>
            {money(fromPrice(p))}
          </span>
        </p>
      </div>
    </article>
  );
}

export function CategoryCard({ c, eager = false }: { c: Category; eager?: boolean }) {
  return (
    <a href={`/categories/${c.slug}`} className="card">
      <span className="card-media">
        <Img
          src={`/img/categories/${c.slug}.svg`}
          alt=""
          width={400}
          height={250}
          eager={eager}
          className="h-auto w-full"
        />
      </span>
      <span className="card-body">
        <span className="card-title" style={{ fontFamily: "var(--font-display)" }}>
          {c.name}
        </span>
        <span className="card-text">{c.intro}</span>
      </span>
    </a>
  );
}

export function HomePage() {
  const heroSrc = fault("image-oversized") ? "/_fault/big-image.svg" : "/img/hero.svg";
  const featured = [
    "raw-almonds",
    "maple-glazed-pecans",
    "almond-butter",
    "classic-trail-mix",
    "tasting-flight-box",
    "ground-almonds",
    "chilli-lime-cashews",
    "nut-butter-trio",
  ].map((s) => PRODUCTS.find((p) => p.slug === s)!);
  const box = PRODUCTS.find((p) => p.slug === "tasting-flight-box")!;
  return (
    <Layout>
      <section className="hero">
        <div>
          <h1>Good nuts, small batches</h1>
          <div className="hero-foot">
            <p
              className="lead"
              style={fault("low-contrast-text") ? { color: "#b9b9b9" } : undefined}
            >
              Raw and roasted nuts, spreads ground in small jars, and boxes ready to give.
            </p>
            <p className="actions">
              <a href="/shop" className="btn">
                Browse all products
              </a>
              <a href="/blog" className="btn-secondary">
                Read the journal
              </a>
            </p>
            {fault("redirect-chain-3-hops") ? (
              <p className="section-tight">
                <a href="/_fault/r1">Seasonal picks</a>
              </p>
            ) : null}
          </div>
        </div>
        <div className="hero-art">
          <Img
            src={heroSrc}
            alt="A heap of illustrated almonds, walnuts, pecans and cashews"
            width={1200}
            height={800}
            priority
          />
        </div>
      </section>

      <section className="section" aria-labelledby="cats">
        <div className="section-head">
          <h2 id="cats">Shop by category</h2>
        </div>
        <div className="grid grid-3">
          {CATEGORIES.map((c, i) => (
            <CategoryCard key={c.slug} c={c} eager={i < 3} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="featured">
        <div className="section-head">
          <h2 id="featured">Customer favourites, on paper</h2>
          <p>These are the pages people open most in our imaginary shop.</p>
        </div>
        <div className="grid grid-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="gifts">
        <div className="band">
          <div className="band-copy">
            <h2 id="gifts">Boxes ready to give</h2>
            <p>Pick a box, skip the wrapping paper. {box.name} is the one people try first.</p>
            <p className="actions">
              <a href="/categories/gift-boxes" className="btn">
                See the gift boxes
              </a>
            </p>
          </div>
          <ProductImage
            product={box}
            width={800}
            height={600}
            decorative
            className="h-auto w-full"
          />
        </div>
      </section>

      <section className="section" aria-labelledby="journal">
        <div className="section-head">
          <h2 id="journal">From the journal</h2>
          <a href="/blog">All journal posts</a>
        </div>
        <div className="grid grid-3">
          {POSTS.slice(0, 3).map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
}

export function ShopPage() {
  return (
    <Layout>
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
        ]}
      />
      <div className="page-head">
        <h1>All products</h1>
        <p className="lead">
          {PRODUCTS.length} products in {CATEGORIES.length} categories. This is a demo catalogue:
          nothing is for sale.
        </p>
      </div>
      {CATEGORIES.map((c) => (
        <section key={c.slug} className="section-tight" aria-labelledby={`c-${c.slug}`}>
          <div className="section-head">
            <h2 id={`c-${c.slug}`}>{c.name}</h2>
            <a href={`/categories/${c.slug}`}>Shop all {c.name.toLowerCase()}</a>
          </div>
          <div className="grid grid-4">
            {productsIn(c.slug).map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ))}
    </Layout>
  );
}

export function CategoryPage({ category }: { category: Category }) {
  const items = productsIn(category.slug);
  const others = CATEGORIES.filter((c) => c.slug !== category.slug);
  return (
    <Layout>
      <Breadcrumbs crumbs={categoryCrumbs(category)} />
      <div className="page-head">
        <h1>{category.name}</h1>
        <p className="lead">{category.intro}</p>
        {category.slug === "gift-boxes" && !fault("orphan-gift-guide") ? (
          <p className="lead">
            Not sure what to pick? Read the <a href="/gift-guide">nut gift guide</a>.
          </p>
        ) : null}
      </div>
      <div className="grid grid-3">
        {items.map((p, i) => (
          <ProductCard key={p.slug} p={p} level="h2" eager={i < 3} />
        ))}
      </div>
      <section className="section" aria-labelledby="more-cats">
        <div className="section-head">
          <h2 id="more-cats">More categories</h2>
        </div>
        <ul className="actions list-none">
          {others.map((c) => (
            <li key={c.slug}>
              <a href={`/categories/${c.slug}`} className="btn-secondary">
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

function AddToCart({ p }: { p: Product }) {
  const [idx, setIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const v = p.variants[idx]!;
  return (
    <div className="buy-box">
      <p className="price price-lg" aria-live="polite">
        {money(v.priceCents)}
      </p>
      <div className="field">
        <label htmlFor="variant" className="label">
          Size
        </label>
        <select
          id="variant"
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="select"
        >
          {p.variants.map((x, i) => (
            <option key={x.weightG} value={i}>
              {x.label} ({money(x.priceCents)})
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn"
        onClick={() => {
          addToCart(p.slug, v.weightG);
          setAdded(true);
        }}
      >
        Add to cart (demo)
      </button>
      <p role="status" className="status">
        {added ? "Added to your demo cart. " : ""}
        <a href="/cart">View cart</a>
      </p>
    </div>
  );
}

export function ProductPage({ product: p }: { product: Product }) {
  const related = relatedProducts(p);
  const posts = postsFor(p);
  const wiki = NUT_WIKI[p.nut]!;
  const contains = (p.contains ?? [])
    .map((s) => PRODUCTS.find((x) => x.slug === s))
    .filter((x): x is Product => !!x);
  const n = p.nutrition;
  const rows: [string, string][] = [
    ["Energy", `${n.energyKcal} kcal`],
    ["Fat", `${n.fatG} g`],
    ["of which saturates", `${n.saturatesG} g`],
    ["Carbohydrate", `${n.carbsG} g`],
    ["of which sugars", `${n.sugarsG} g`],
    ["Fibre", `${n.fibreG} g`],
    ["Protein", `${n.proteinG} g`],
    ["Salt", `${n.saltG} g`],
  ];
  return (
    <Layout>
      <Breadcrumbs crumbs={productCrumbs(p)} />
      <div className="split">
        <div className="gallery">
          <ProductImage product={p} width={800} height={600} priority className="h-auto w-full" />
        </div>
        <div className="buy">
          <span className="badge">{getCategory(p.category)?.name ?? "Nuts"}</span>
          <h1>{p.name}</h1>
          <p className="lead">{p.tagline}</p>
          <AddToCart p={p} />
          <div className="facts">
            <p>
              Allergens:{" "}
              <strong>{p.allergens.length ? p.allergens.join(", ") : "none declared"}</strong>.{" "}
              {p.mayContain}
            </p>
            <p className="hint">Demo store: nothing is for sale and no order can be placed.</p>
          </div>
        </div>
      </div>

      <div className="section-tight split split-aside">
        <div>
          <section aria-labelledby="about-product" className="prose-nuts info-block">
            <h2 id="about-product">About this product</h2>
            {p.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <p>
              Learn more about the{" "}
              <a href={wiki.href} rel="noopener">
                {wiki.label.toLowerCase()}
              </a>{" "}
              on Wikipedia, or browse the whole{" "}
              <a href={`/categories/${p.category}`}>
                {getCategory(p.category)!.name.toLowerCase()}
              </a>{" "}
              range.
            </p>
          </section>
          {contains.length ? (
            <section className="info-block" aria-labelledby="inside">
              <h2 id="inside">What is inside</h2>
              <ul className="prose-nuts" style={{ listStyle: "disc", paddingLeft: "var(--s-5)" }}>
                {contains.map((c) => (
                  <li key={c.slug}>
                    <a href={`/products/${c.slug}`}>{c.name}</a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="info-block" aria-labelledby="ingredients">
            <h2 id="ingredients">Ingredients and allergens</h2>
            <div className="stack">
              <p>
                <strong>Ingredients:</strong> {p.ingredients}
              </p>
              <p>
                <strong>Allergens:</strong>{" "}
                {p.allergens.length ? p.allergens.join(", ") : "none declared"}. {p.mayContain}
              </p>
              <p className="hint">
                Not medical advice. Read the label of any food you buy and see the guidance from the{" "}
                <a href={ALLERGY_LINKS[0]!.href} rel="noopener">
                  US FDA
                </a>{" "}
                or the{" "}
                <a href={ALLERGY_LINKS[1]!.href} rel="noopener">
                  UK Food Standards Agency
                </a>
                .
              </p>
            </div>
          </section>
          <section className="info-block" aria-labelledby="nutrition">
            <h2 id="nutrition">Nutrition</h2>
            <table className="table">
              <caption>Typical values per 100 g (illustrative, this is a demo product)</caption>
              <thead>
                <tr>
                  <th scope="col">Nutrient</th>
                  <th scope="col">Per 100 g</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="info-block" aria-labelledby="storage">
            <h2 id="storage">Storage</h2>
            <p className="prose-nuts">{p.storage}</p>
          </section>
          {fault("mixed-content-image") && p.slug === "smooth-peanut-butter" ? (
            <p className="section-tight">
              <img
                src={`http://${SITE.host}/logo.svg`}
                alt="The Nut Shop badge"
                width={64}
                height={64}
              />
            </p>
          ) : null}
        </div>
        <aside aria-label="Related reading">
          {posts.length ? (
            <section className="buy-box" aria-labelledby="from-journal">
              <h2 id="from-journal" style={{ fontSize: "var(--fs-3)" }}>
                From the journal
              </h2>
              <ul className="list-plain">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <a href={`/blog/${post.slug}`}>{post.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      <section className="section" aria-labelledby="related">
        <div className="section-head">
          <h2 id="related">You might also like</h2>
        </div>
        <div className="grid grid-4">
          {related.map((r) => (
            <ProductCard key={r.slug} p={r} />
          ))}
        </div>
        {fault("broken-internal-link") && p.slug === "raw-almonds" ? (
          <p className="section-tight">
            <a href="/products/almond-brittle-deluxe">Almond brittle deluxe</a>
          </p>
        ) : null}
      </section>
    </Layout>
  );
}
