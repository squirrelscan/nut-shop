import { SITE } from "#/config/site";
import { POSTS, PRODUCTS, getProduct, productsFor } from "#/content";
import { furtherReading } from "#/content/catalog";
import { FAQ, STATIC_PAGES, type StaticPage } from "#/content/pages";
import type { Post } from "#/content/types";
import { formatDate } from "#/lib/format";
import { Breadcrumbs, Layout } from "#/components/layout";
import { Img } from "#/components/media";
import { postCrumbs } from "#/seo/head";
import { fault } from "../../faults/runtime";
import { ProductCard } from "#/pages/shop";

export function PostCard({
  post,
  level = "h3",
  eager = false,
}: {
  post: Post;
  level?: "h2" | "h3";
  eager?: boolean;
}) {
  const H = level;
  return (
    <article className="card">
      <a href={`/blog/${post.slug}`} className="card-media" tabIndex={-1} aria-hidden="true">
        <Img
          src={`/img/posts/${post.slug}.svg`}
          alt=""
          width={600}
          height={315}
          eager={eager}
          className="h-auto w-full"
        />
      </a>
      <div className="card-body">
        <p className="meta">
          <span className="badge badge-warm">{post.topic}</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </p>
        <H className="card-title">
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </H>
        <p className="card-text card-clamp">{post.description}</p>
      </div>
    </article>
  );
}

export function BlogIndexPage() {
  return (
    <Layout>
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ]}
      />
      <div className="page-head">
        <h1>The journal</h1>
        <p className="lead">
          Roasting guides, storage tips, recipes and explainers. Written for a demo store, but the
          kitchen advice is real.
        </p>
      </div>
      <div className="grid grid-3">
        {POSTS.map((p) => (
          <PostCard key={p.slug} post={p} level="h2" eager={POSTS.indexOf(p) < 3} />
        ))}
      </div>
    </Layout>
  );
}

/** First two paragraphs only (fault: thin-content-page). */
export const thin = (html: string): string => html.split("</p>").slice(0, 2).join("</p>") + "</p>";

export function PostPage({ post }: { post: Post }) {
  const html =
    fault("thin-content-page") && post.slug === "storing-nuts-so-they-stay-fresh"
      ? thin(post.html)
      : post.html;
  const products = productsFor(post);
  const idx = POSTS.findIndex((p) => p.slug === post.slug);
  const more = [POSTS[(idx + 1) % POSTS.length]!, POSTS[(idx + 2) % POSTS.length]!];
  return (
    <Layout>
      <Breadcrumbs crumbs={postCrumbs(post)} />
      <article>
        <header>
          <p className="meta">
            <span className="badge badge-warm">{post.topic}</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>{Math.max(1, Math.round(post.words / 220))} min read</span>
          </p>
          <h1 style={{ marginTop: "var(--s-3)", maxWidth: "20ch" }}>{post.title}</h1>
          <p className="lead">{post.description}</p>
        </header>
        <Img
          src={`/img/posts/${post.slug}.svg`}
          alt={`Illustration for the post: ${post.title}`}
          width={1200}
          height={630}
          priority
          className="article-art"
        />
        <div className="prose-nuts section-tight" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <section className="section" aria-labelledby="further">
        <div className="section-head">
          <h2 id="further">Further reading</h2>
        </div>
        <ul className="prose-nuts">
          {furtherReading(products.map((p) => p.nut)).map((l) => (
            <li key={l.href}>
              <a href={l.href} rel="noopener">
                {l.label} on Wikipedia
              </a>
            </li>
          ))}
        </ul>
      </section>
      {products.length ? (
        <section className="section" aria-labelledby="mentioned">
          <div className="section-head">
            <h2 id="mentioned">Products in this post</h2>
          </div>
          <div className="grid grid-4">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="section" aria-labelledby="keep-reading">
        <div className="section-head">
          <h2 id="keep-reading">Keep reading</h2>
        </div>
        <div className="grid grid-2">
          {more.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
}

export function StaticPageView({ page }: { page: StaticPage }) {
  const isAbout = page.path === "/about";
  const isShipping = page.path === "/shipping-and-returns";
  const crumbs = [
    { name: "Home", path: "/" },
    { name: page.h1, path: page.path },
  ];
  const Heading = isAbout && fault("h1-missing") ? "div" : "h1";
  return (
    <Layout>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page-head">
        <Heading className={isAbout && fault("h1-missing") ? "h1-like" : undefined}>
          {page.h1}
        </Heading>
        {isShipping && fault("h1-duplicate") ? (
          <h1 style={{ fontSize: "var(--fs-4)" }}>Delivery and refunds</h1>
        ) : null}
        <p className="lead">{page.lead}</p>
      </div>
      <div className="prose-nuts">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((b, i) => (
              <p key={i}>{b}</p>
            ))}
          </section>
        ))}
        {page.path === "/about" ? (
          <p>
            Browse the <a href="/shop">full product list</a>, read the <a href="/blog">journal</a>,
            or see the <a href="/faq">FAQ</a>. For background on what a nut actually is, Wikipedia
            has a good{" "}
            <a href="https://en.wikipedia.org/wiki/Nut_(fruit)" rel="noopener">
              overview
            </a>
            .
          </p>
        ) : null}
        {isAbout && fault("broken-link-gone-410") ? (
          <p>
            <a href={`${SITE.baseUrl}/_fault/gone`}>Our old press kit</a>
          </p>
        ) : null}
        {page.path === "/contact" && fault("broken-external-invalid-domain") ? (
          <p>
            <a href="https://nut-supplier.invalid/">Our supplier</a>
          </p>
        ) : null}
        {isShipping ? (
          <p>
            Looking for something else? See the <a href="/faq">FAQ</a> or{" "}
            <a href="/contact">contact us</a>.
            {fault("soft-404") ? (
              <>
                {" "}
                You can also <a href="/_fault/soft-404">track a demo order</a>.
              </>
            ) : null}
          </p>
        ) : null}
        {page.path === "/contact" ? (
          <p style={{ fontSize: "var(--fs-4)" }}>
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </p>
        ) : null}
        {page.path === "/gift-guide" ? (
          <ul>
            {[
              "small-gift-box",
              "tasting-flight-box",
              "nut-butter-trio",
              "big-nut-hamper",
              "festive-nut-collection",
              "roasters-selection-box",
            ].map((s) => {
              const p = getProduct(s)!;
              return (
                <li key={s}>
                  <a href={`/products/${s}`}>{p.name}</a>: {p.tagline}
                </li>
              );
            })}
            <li>
              <a href="/categories/gift-boxes">See all gift boxes</a>
            </li>
            <li>
              Need ideas for what goes in a box? Read{" "}
              <a href="/blog/how-to-build-a-nut-gift-box">how to build a nut gift box</a>.
            </li>
          </ul>
        ) : null}
      </div>
    </Layout>
  );
}

export function FaqPage() {
  return (
    <Layout>
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]}
      />
      <div className="page-head">
        <h1>Frequently asked questions</h1>
      </div>
      <div className="prose-nuts">
        {FAQ.map((f) => (
          <section key={f.q}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </section>
        ))}
        <p>
          More questions? <a href="/contact">Get in touch</a>, read the{" "}
          <a href="/blog/storing-nuts-so-they-stay-fresh">storage guide</a>, or learn{" "}
          <a href="/about">who runs this demo store</a>.
        </p>
      </div>
    </Layout>
  );
}

export { STATIC_PAGES, PRODUCTS };
