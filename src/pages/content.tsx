import { SITE } from "#/config/site";
import { POSTS, PRODUCTS, getProduct, productsFor } from "#/content";
import { FAQ, STATIC_PAGES, type StaticPage } from "#/content/pages";
import type { Post } from "#/content/types";
import { formatDate } from "#/lib/format";
import { Breadcrumbs, Layout } from "#/components/layout";
import { Img } from "#/components/media";
import { postCrumbs } from "#/seo/head";
import { fault } from "../../faults/runtime";
import { ProductCard } from "#/pages/shop";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card flex flex-col">
      <a href={`/blog/${post.slug}`} className="block">
        <Img
          src={`/img/posts/${post.slug}.svg`}
          alt={`Illustration for the post: ${post.title}`}
          width={600}
          height={315}
          className="h-auto w-full"
        />
      </a>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted">
          {post.topic} · <time dateTime={post.date}>{formatDate(post.date)}</time>
        </p>
        <h3 className="text-lg">
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </h3>
        <p className="text-sm text-muted">{post.description}</p>
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
      <h1 className="text-4xl">The journal</h1>
      <p className="mt-2 max-w-prose text-lg text-muted">
        Roasting guides, storage tips, recipes and explainers. Written for a demo store, but the
        kitchen advice is real.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((p) => (
          <PostCard key={p.slug} post={p} />
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
          <p className="text-sm uppercase tracking-wide text-muted">
            {post.topic} · <time dateTime={post.date}>{formatDate(post.date)}</time> ·{" "}
            {Math.max(1, Math.round(post.words / 220))} min read
          </p>
          <h1 className="mt-1 max-w-3xl text-4xl">{post.title}</h1>
          <p className="mt-2 max-w-prose text-lg text-muted">{post.description}</p>
        </header>
        <Img
          src={`/img/posts/${post.slug}.svg`}
          alt={`Illustration for the post: ${post.title}`}
          width={1200}
          height={630}
          priority
          className="mt-6 h-auto w-full max-w-3xl rounded-xl"
        />
        <div className="prose-nuts mt-8" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      {products.length ? (
        <section className="mt-12" aria-labelledby="mentioned">
          <h2 id="mentioned" className="text-2xl">
            Products in this post
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="mt-12" aria-labelledby="keep-reading">
        <h2 id="keep-reading" className="text-2xl">
          Keep reading
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
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
      <Heading className="text-4xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
        {page.h1}
      </Heading>
      {isShipping && fault("h1-duplicate") ? (
        <h1 className="mt-2 text-2xl">Delivery and refunds</h1>
      ) : null}
      <p className="mt-2 max-w-prose text-lg text-muted">{page.lead}</p>
      <div className="prose-nuts mt-6">
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
            Browse the <a href="/shop">shop</a>, read the <a href="/blog">journal</a>, or see the{" "}
            <a href="/faq">FAQ</a>. For background on what a nut actually is, Wikipedia has a good{" "}
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
        {isAbout && fault("broken-external-invalid-domain") ? (
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
          <p className="text-xl">
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
      <h1 className="text-4xl">Frequently asked questions</h1>
      <div className="prose-nuts mt-6">
        {FAQ.map((f) => (
          <section key={f.q}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </section>
        ))}
        <p>
          More questions? <a href="/contact">Get in touch</a> or read the{" "}
          <a href="/blog/storing-nuts-so-they-stay-fresh">storage guide</a>.
        </p>
      </div>
    </Layout>
  );
}

export { STATIC_PAGES, PRODUCTS };
